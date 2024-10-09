from flask import Flask, request, jsonify
from redis import Redis
from rq import Queue
from detect import run_inference

q = Queue(connection=Redis(host="redis"))

app = Flask(__name__)


@app.route("/queue", methods=["POST"])
def add_item_to_queue():
    try:
        event = request.get_json()
        job = q.enqueue(run_inference, event, at_front=True)
        print("Job id: %s" % job.id)
        return jsonify({"status": 200})
    except Exception as e:
        print(e)
        return jsonify({"status": 500})
