if [ ! -f /data/keyfile ]; then
    echo "Генерация keyfile для реплика-сета..."
    mkdir -p /data
    openssl rand -base64 756 > /data/keyfile
    chmod 400 /data/keyfile
    echo "Keyfile создан"
fi;
mongod --fork --logpath /dev/null --bind_ip_all --auth;
sleep 1;
mongo --eval "
    db = db.getSiblingDB(\"admin\");
    db.createUser({
    user: \"user\",
    pwd: \"password\",
    roles: [{ role: \"root\", db: \"admin\" }]
    });
";
sleep 1;
mongod --shutdown;
sleep 1;
mongod --replSet rs0 --keyFile /data/keyfile --bind_ip_all --auth --fork --logpath /dev/null;
sleep 1;
mongo -u user -p password --verbose --eval "rs.initiate()";
mongod --shutdown;
sleep 1;
echo "-----------------finish-------------------";
mongod --replSet rs0 --keyFile /data/keyfile --bind_ip_all --auth
