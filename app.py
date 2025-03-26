from flask import Flask, render_template, request, jsonify
import json
import re
from datetime import datetime

app = Flask(__name__)

def extract_tables_from_statement(statement):
    if not statement:
        return []
    
    # Remove SQL comments to avoid false positives
    statement = re.sub(r'--.*$', '', statement, flags=re.MULTILINE)
    statement = re.sub(r'/\*.*?\*/', '', statement, flags=re.DOTALL)
    statement = ' '.join(statement.split())
    
    tables = []
    parts = re.split(r'\s+(?:FROM|JOIN)\s+', statement.upper())
    for part in parts[1:] if parts else []:
        table_name = part.split()[0].strip('()')
        if table_name and table_name not in ('SELECT', 'WHERE', 'GROUP', 'ORDER'):
            tables.append(table_name)
    
    return list(set(tables))

def check_index_usage(plan):
    if not plan:
        return False
    return 'INDEX' in plan.upper()

def validate_log_data(data):
    """Validate the structure of the log data"""
    if not isinstance(data, dict):
        raise ValueError("Invalid log format: root must be an object")
    
    if "RecordSet" not in data:
        raise ValueError("Invalid log format: missing RecordSet")
    
    if not isinstance(data["RecordSet"], list):
        raise ValueError("Invalid log format: RecordSet must be an array")
    
    return True

def parse_trace_log(log_data):
    records = log_data.get("RecordSet", [])
    parsed_data = []
    tables_set = set()
    errors = []
    
    for index, record in enumerate(records):
        try:
            if not isinstance(record, dict):
                raise ValueError(f"Record #{index + 1} is not an object")

            statement = record.get("StatementText", "")
            plan = record.get("StatementPlan", "")
            tables = extract_tables_from_statement(statement)
            tables_set.update(tables)
            
            # Validate and convert execution time
            execution_time = record.get("Time")
            if execution_time is not None:
                try:
                    execution_time = float(execution_time)
                except (ValueError, TypeError):
                    execution_time = None
            
            parsed_record = {
                "timestamp": record.get("TimeStamp"),
                "event": record.get("Event"),
                "statement": statement,
                "execution_time": execution_time,
                "plan": plan,
                "user": record.get("User"),
                "process": record.get("ProcessName"),
                "reads": record.get("Reads"),
                "writes": record.get("Writes"),
                "fetches": record.get("Fetches"),
                "tables": tables,
                "uses_index": check_index_usage(plan)
            }
            parsed_data.append(parsed_record)
        
        except Exception as e:
            errors.append({
                "record_index": index,
                "error": str(e)
            })
    
    stats = {
        "total_records": len(records),
        "parsed_records": len(parsed_data),
        "error_records": len(errors),
        "tables_found": len(tables_set)
    }
    
    return parsed_data, sorted(list(tables_set)), stats, errors

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'log_file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file provided"
            })

        log_file = request.files['log_file']
        
        if not log_file.filename:
            return jsonify({
                "success": False,
                "error": "No file selected"
            })
            
        if not log_file.filename.endswith('.json'):
            return jsonify({
                "success": False,
                "error": "Invalid file type. Please upload a JSON file"
            })

        try:
            log_data = json.load(log_file)
        except json.JSONDecodeError as e:
            return jsonify({
                "success": False,
                "error": f"Invalid JSON format: {str(e)}"
            })

        try:
            validate_log_data(log_data)
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": str(e)
            })

        parsed_data, tables, stats, errors = parse_trace_log(log_data)
        
        if not parsed_data and errors:
            return jsonify({
                "success": False,
                "error": "Failed to parse any records",
                "errors": errors
            })
        
        # Calculate additional statistics
        total_queries = len(parsed_data)
        slow_queries = len([q for q in parsed_data if q["execution_time"] and q["execution_time"] > 1000])
        no_index_queries = len([q for q in parsed_data if not q["uses_index"] and q["statement"]])
        
        statement_types = {}
        for record in parsed_data:
            stmt = record["statement"]
            if stmt:
                stmt_type = stmt.strip().split()[0].upper()
                statement_types[stmt_type] = statement_types.get(stmt_type, 0) + 1
        
        return jsonify({
            "success": True,
            "data": parsed_data,
            "tables": tables,
            "stats": {
                "total_queries": total_queries,
                "slow_queries": slow_queries,
                "no_index_queries": no_index_queries,
                "statement_types": statement_types,
                "processing_stats": stats
            },
            "errors": errors if errors else None
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)