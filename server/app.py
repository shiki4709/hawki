"""
GTM Runner — serves both the dashboard frontend and the LinkedIn scraper API.

Run: python3 app.py
Then open http://localhost:5001
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from linkedin import scrape_post_likers, load_cookies

# Serve the dashboard from the parent directory
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = Flask(__name__, static_folder=None)
CORS(app)

COOKIES = None


def get_cookies():
    # Always reload from file to pick up fresh cookies
    try:
        return load_cookies("cookies.json")
    except FileNotFoundError:
        return None


@app.route("/api/scrape", methods=["POST"])
def scrape():
    cookies = get_cookies()
    if not cookies:
        return jsonify({"error": "No cookies.json found. Export your LinkedIn cookies first."}), 400

    data = request.get_json()
    url = data.get("url", "").strip()
    if not url or "linkedin.com" not in url:
        return jsonify({"error": "Invalid LinkedIn URL"}), 400

    try:
        result = scrape_post_likers(url, cookies)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


@app.route("/api/status", methods=["GET"])
def status():
    cookies = get_cookies()
    return jsonify({
        "cookies_loaded": cookies is not None,
        "cookie_count": len(cookies) if cookies else 0,
    })


@app.route("/")
def index():
    return send_from_directory(parent_dir, "index.html")


@app.route("/<path:path>")
def static_files(path):
    # Don't serve paths starting with 'api'
    if path.startswith("api"):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(parent_dir, path)


if __name__ == "__main__":
    print("GTM Runner starting on http://localhost:5001")
    print("Make sure cookies.json exists in the server/ directory")
    app.run(port=5001, debug=True)
