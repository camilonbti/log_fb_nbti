from flask import Flask, render_template, request, jsonify
import json
import re
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def extract_tables_from_statement(statement):
    if not statement:
        return []
    
    logger.debug(f"Extracting tables from statement: {statement}")
    statement = re.sub(r'--.*$', '', statement, flags=re.MULTILINE)
    statement = re.sub(r'/\*.*?\*/', '', statement, flags=re.DOTALL)
    statement = ' '.join(statement.split())
    
    tables = []
    parts = re.split(r'\s+(?:FROM|JOIN)\s+', statement.upper())
    for part in parts[1:] if parts else []:
        table_name = part.split()[0].strip().strip('()')
        if table_name and table_name not in ('SELECT', 'WHERE', 'GROUP', 'ORDER'):
            tables.append(table_name)
    
    logger.debug(f"Extracted tables: {tables}")
    return list(set(tables))

def check_index_usage(plan):
    if not plan:
        return False
    return 'INDEX' in plan.upper()

def parse_trace_log(log_data):
    logger.info("Starting to parse trace log")
    logger.debug(f"Input log data: {json.dumps(log_data, indent=2)}")
    
    records = log_data.get("RecordSet", [])
    logger.info(f"Found {len(records)} records in log")
    
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
            logger.debug(f"Parsed record: {json.dumps(parsed_record, indent=2)}")
    
    logger.info(f"Successfully parsed {len(parsed_data)} statements")
    logger.info(f"Found tables: {tables_set}")
    
    return parsed_data, sorted(list(tables_set))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        logger.info("Received analyze request")
        
        if 'log_file' not in request.files:
            logger.error("No log file in request")
            return jsonify({"success": False, "error": "No file uploaded"})
            
        log_file = request.files['log_file']
        logger.info(f"Processing file: {log_file.filename}")
        
        try:
            log_data = json.load(log_file)
            logger.debug("Successfully loaded JSON data")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {str(e)}")
            return jsonify({"success": False, "error": "Invalid JSON file"})
        
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
        
        logger.info(f"Analysis complete. Found {total_queries} queries, {slow_queries} slow queries")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)