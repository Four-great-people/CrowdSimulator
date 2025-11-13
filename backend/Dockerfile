FROM ubuntu:24.04
WORKDIR /app

RUN apt-get update
RUN apt-get install -y wget cmake g++
RUN apt-get install -y libasio-dev zlib1g-dev libssl-dev libgtest-dev && \
    wget https://github.com/CrowCpp/Crow/releases/download/v1.2.1.2/Crow-1.2.1-Linux.deb && \
    dpkg -i Crow-1.2.1-Linux.deb
COPY . ./backend
EXPOSE 8080
RUN cd backend && \
    mkdir build && \
    cd build && \
    cmake .. && \
    make backend
CMD ["./backend/build/backend"]