FROM ubuntu:24.04
WORKDIR /app/middle-end

COPY . .
RUN apt-get update
RUN apt-get install -y python3-pip
EXPOSE 5000
RUN python3 -m pip config set global.break-system-packages true && \
    pip3 install -r requirements.txt && \
    pip3 install -r crowd_db/requirements.txt

ENV CPP_BACKEND_URL=http://backend:8080/route
ENV MONGODB_URI=mongodb://db:27017
ENV MONGODB_DB=crowdsim
ENV MONGODB_COLLECTION_MAPS=maps

ENV FLASK_APP=app.py
ENV FLASK_ENV=development
CMD ["flask", "run", "--port", "5000", "--host", "0.0.0.0"]