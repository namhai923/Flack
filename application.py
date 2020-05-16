import os, datetime
from collections import OrderedDict

from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
from flask_session import Session

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "filesystem"
# app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)
Session(app)

@app.route("/")
def index():
    # session.clear()
    print(session)
    return render_template("index.html")

@app.route("/add-channel", methods=["POST"])
def channel():
    channel = request.form.get("channel")
    if channel not in session:
        session[channel] = OrderedDict()
        return jsonify(channel)
    else:
        return jsonify("")
    print(session)

@app.route("/add-message", methods=["POST"])
def message():
    now = datetime.datetime.now()
    time = "{hour}:{minute}".format(hour=now.hour, minute=now.minute)
    message = request.form.get("message")
    channel = request.form.get("channel")
    username = request.form.get("username")
    channel = channel[:channel.index("(")-1]
    session[channel][message] = [username, time]
    print(session)
    return jsonify("")

@app.route("/view-messages", methods=["POST"])
def view():
    channel = request.form.get("channel")
    channel = channel[:channel.index("(")-1]
    messages = session[channel]
    return jsonify(messages)

@socketio.on("send message")
def add_message(data):
    message = data["message"]
    username = data["username"]
    now = datetime.datetime.now()
    time = "{hour}:{minute}".format(hour=now.hour, minute=now.minute)
    print(session)
    emit("view message", {"message":message,"time":time,"username":username}, boardcast=True)