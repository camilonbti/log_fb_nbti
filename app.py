from flask import Flask, render_template, request, jsonify, Response, stream_with_context
import json
import re
from datetime import datetime
import itertools
from werkzeug.utils import secure_filename
import os
import tempfile
import codecs
import ijson

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024  # 1GB
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()

def safe_int(value, default=0):
    """Converte valor para inteiro de forma segura"""
    try:
        return int(float(value)) if value is not None else default
    except (ValueError, TypeError):
        return default

def extract_tables_from_statement(statement):
    if not statement:
        return []
    
    statement = re.sub(r'--.*$', '', statement, flags=re.MULTILINE)
    statement = re.sub(r'/\*.*?\*/', '', statement, flags=re.DOTALL)
    statement = ' '.join(statement.split())
    
    tables = []
    parts = re.split(r'\s+(?:FROM|JOIN)\s+', statement.upper())
    for part in parts[1:] if parts else []:
        table_name = part.split()[0].strip().strip('()')
        if table_name and table_name not in ('SELECT', 'WHERE', 'GROUP', 'ORDER'):
            tables.append(table_name)
    
    return list(set(tables))

def check_index_usage(plan):
    if not plan:
        return False
    return 'INDEX' in plan.upper()

def process_record(record):
    """Processa um registro individual, garantindo valores numéricos válidos"""
    return {
        'timestamp': record.get('TimeStamp', ''),
        'event': record.get('Event', ''),
        'statement': record.get('StatementText', ''),
        'tables': extract_tables_from_statement(record.get('StatementText', '')),
        'execution_time': safe_int(record.get('Time')),
        'plan': record.get('StatementPlan', ''),
        'user': record.get('User', ''),
        'process': record.get('ProcessName', ''),
        'reads': safe_int(record.get('Reads')),
        'writes': safe_int(record.get('Writes')),
        'fetches': safe_int(record.get('Fetches')),
        'uses_index': check_index_usage(record.get('StatementPlan', ''))
    }

def parse_trace_log(log_data):
    """Processa os registros do log"""
    if not isinstance(log_data, dict) or 'RecordSet' not in log_data:
        return [], []

    records = log_data['RecordSet']
    tables_set = set()
    parsed_data = []

    for record in records:
        if record.get('StatementText'):
            processed_record = process_record(record)
            tables_set.update(processed_record['tables'])
            parsed_data.append(processed_record)

    return parsed_data, sorted(list(tables_set))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'log_file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"})
        
        log_file = request.files['log_file']
        if not log_file:
            return jsonify({"success": False, "error": "No file selected"})
        
        filename = secure_filename(log_file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        log_file.save(temp_path)
        
        try:
            with open(temp_path, 'r', encoding='utf-8-sig') as f:
                log_data = json.load(f)
            
            parsed_data, tables = parse_trace_log(log_data)
            
            total_queries = len(parsed_data)
            slow_queries = len([q for q in parsed_data if q['execution_time'] > 1000])
            no_index_queries = len([q for q in parsed_data if not q['uses_index'] and q['statement']])
            
            statement_types = {}
            for record in parsed_data:
                stmt = record['statement']
                if stmt:
                    stmt_type = stmt.strip().split()[0].upper()
                    statement_types[stmt_type] = statement_types.get(stmt_type, 0) + 1
            
            response_data = {
                "success": True,
                "data": parsed_data,
                "tables": tables,
                "stats": {
                    "total_queries": total_queries,
                    "slow_queries": slow_queries,
                    "no_index_queries": no_index_queries,
                    "statement_types": statement_types
                }
            }
            
            return jsonify(response_data)
            
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            return jsonify({"success": False, "error": str(e)})
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
    except Exception as e:
        print(f"Error in analyze endpoint: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)