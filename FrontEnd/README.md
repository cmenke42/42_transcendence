Docker command:

```
docker-compose build
docker-compose up
```

Open pgAdmin in your web browser. (localhost:5050)
In the Browser panel on the left, right-click on "Servers".
Depending on your version of pgAdmin, you should see either "Create" > "Server" or "Create" > "Server Group". If you only see "Server Group", you can create a new group and then create a new server within that group.
In the "Create - Server" or "Create - Server Group" dialog box that appears, you'll need to fill in the details for your server.
For the "Connection" tab:

Host name/address: db (the name of your PostgreSQL service in Docker Compose)
Port: 5432
Maintenance database: hello_django_dev
Username: hello_django
Password: hello_django

after creating the table through models run these commands
```
docker-compose run web python manage.py makemigrations <your_app_name>
docker-compose run web python manage.py migrate
```

for stoping the docker-container
```
docker-compose down
```
for removing it use
```
docker-compose down --rmi all
```


Remove migration files
```
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc"  -delete
```

if there is migrations issue
Delete the database. If you're using a PostgreSQL database in a Docker container, you can do this with the following command:

```
docker-compose up --build
```

```
docker-compose down -v
docker-compose up -d
docker-compose exec web python manage.py migrate
```
to see the version 

```
pip show <django-cors-headers>
```

npm install
1. @auth0/angular-jwt
2. jwt-decode
