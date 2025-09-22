FROM ubuntu:24.04
WORKDIR /app/middle-end

COPY . .
RUN apt-get update
RUN apt-get install -y python3-pip
EXPOSE 5000
RUN python3 -m pip config set global.break-system-packages true && \
    pip3 install -r requirements.txt
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
CMD ["flask", "run", "--port", "5000"]