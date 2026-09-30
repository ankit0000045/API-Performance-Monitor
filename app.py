from flask import Flask, render_template, jsonify
import requests
import json
import time
from datetime import datetime
import logging
import os
print("Current working directory:", os.getcwd())
print("Static folder exists:", os.path.exists('static'))
print("JS file exists:", os.path.exists('static/js/dashboard.js'))

# Initialize Flask app
app = Flask(__name__, static_folder='static', static_url_path='/static')

# Configure logging to track API health
logging.basicConfig(
    filename='logs/api_health.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class APIHealthMonitor:
    """
    Main class to monitor multiple APIs
    Simulates what Postman does but in Python code
    """
    
    def __init__(self):
        # Load API configurations from JSON file
        with open('config.json', 'r') as f:
            self.api_configs = json.load(f)
    
    def check_api_health(self, api_config):
        """
        Check if a single API is healthy
        Returns status, response_time, and error info
        """
        try:
            start_time = time.time()
            
            # Make HTTP request to API (same as Postman does)
            response = requests.get(
                api_config['url'], 
                timeout=api_config.get('timeout', 5)
            )
            
            end_time = time.time()
            response_time = round((end_time - start_time) * 1000, 2)  # Convert to milliseconds
            
            # Check if API responded successfully
            if response.status_code == 200:
                # Log successful check
                logging.info(f"✅ {api_config['name']} - Healthy - {response_time}ms")
                return {
                    'name': api_config['name'],
                    'status': 'healthy',
                    'response_time': response_time,
                    'status_code': response.status_code,
                    'last_checked': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            else:
                # Log failed check
                logging.warning(f"⚠️ {api_config['name']} - Unhealthy - Status: {response.status_code}")
                return {
                    'name': api_config['name'],
                    'status': 'unhealthy',
                    'response_time': response_time,
                    'status_code': response.status_code,
                    'last_checked': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                
        except requests.exceptions.RequestException as e:
            # Log error
            logging.error(f"❌ {api_config['name']} - Error: {str(e)}")
            return {
                'name': api_config['name'],
                'status': 'error',
                'response_time': 0,
                'error': str(e),
                'last_checked': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
    
    def check_all_apis(self):
        """
        Check health of all configured APIs
        This replicates running all Postman collections
        """
        results = []
        for api_config in self.api_configs['apis']:
            result = self.check_api_health(api_config)
            results.append(result)
        return results

# Initialize monitor
monitor = APIHealthMonitor()

@app.route('/')
def dashboard():
    """
    Main dashboard route - shows HTML page
    """
    return render_template('dashboard.html')

@app.route('/api/health-check')
def api_health_check():
    """
    API endpoint that returns health status of all monitored APIs
    Frontend JavaScript will call this to update dashboard
    """
    results = monitor.check_all_apis()
    return jsonify({
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_apis': len(results),
        'healthy_apis': len([r for r in results if r['status'] == 'healthy']),
        'results': results
    })

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5000)
