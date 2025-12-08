FROM ubuntu:24.04
WORKDIR /app/middle-end

RUN apt-get update
RUN apt-get install -y python3-pip
COPY requirements.txt .
EXPOSE 5000
RUN python3 -m pip config set global.break-system-packages true && \
    pip3 install -r requirements.txt
COPY . .

ENV CPP_BACKEND_URL=http://backend:8080/route
ENV MONGODB_URI=mongodb://db:27017/?replicaSet=rs0
ENV MONGODB_DB=crowdsim
ENV MONGODB_COLLECTION_MAPS=maps

ENV FLASK_APP=app.py
ENV FLASK_ENV=development
CMD ["flask", "run", "--port", "5000", "--host", "0.0.0.0"]