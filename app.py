from flask import Flask, render_template, request, jsonify
import json
import re
from datetime import datetime

app = Flask(__name__)

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

def parse_trace_log(log_data):
    records = log_data.get("RecordSet", [])
    parsed_data = []
    tables_set = set()
    
    for record in records:
        if record.get("StatementText"):
            statement = record.get("StatementText")
            plan = record.get("StatementPlan")
            tables = extract_tables_from_statement(statement)
            tables_set.update(tables)
            
            parsed_record = {
                "timestamp": record.get("TimeStamp"),
                "event": record.get("Event"),
                "statement": statement,
                "execution_time": record.get("Time"),
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
    
    return parsed_data, sorted(list(tables_set))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        log_file = request.files['log_file']
        log_data = json.load(log_file)
        parsed_data, tables = parse_trace_log(log_data)
        
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
                "statement_types": statement_types
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)