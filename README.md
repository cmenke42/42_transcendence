[![Contributors][contributors-shield]][contributors-url]
[![Commits][commits-shield]][commits-url]
![Project passed][project-shield]

[contributors-shield]: https://img.shields.io/badge/Contributors-3-orange
[contributors-url]: https://github.com/cmenke42/ft_transcendence/graphs/contributors

[commits-shield]: https://img.shields.io/badge/Last%20commit-September%202024-blue
[commits-url]:  https://github.com/cmenke42/ft_transcendence/graphs/commit-activity

[project-shield]:https://img.shields.io/badge/Project%20passed-121%25-green

## Developed by :

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>    
    <td align="center"><a href="https://github.com/cmenke42/"><img src="https://avatars.githubusercontent.com/u/122057895?v=4"" width="100px;" alt=""/><br /><sub><b>Carlos Menke(cmenke)</b></sub></a><br /><a href="https://profile.intra.42.fr/users/cmenke" title="Intra 42"><img src="https://img.shields.io/badge/Wolfsburg-FFFFFF?style=plastic&logo=42&logoColor=000000" alt="Intra 42"/></a></td>
    <td align="center"><a href="https://github.com/AndersLazis/"><img src="https://avatars.githubusercontent.com/u/130859506?v=4" width="100px;" alt=""/><br /><sub><b>Andrei Putiev(aputiev)</b></sub></a><br /><a href="https://profile.intra.42.fr/users/aputiev" title="Intra 42"><img src="https://img.shields.io/badge/Wolfsburg-FFFFFF?style=plastic&logo=42&logoColor=000000" alt="Intra 42"/></a></td>
    <td align="center"><a href="https://github.com/Ahsanbaloch/"><img src="https://avatars.githubusercontent.com/u/39459572?v=4" width="100px;" alt=""/><br /><sub><b>Ahsan Abdul Salam(ahsalam)</b></sub></a><br /><a href="https://profile.intra.42.fr/users/ahsalam" title="Intra 42"><img src="https://img.shields.io/badge/Wolfsburg-FFFFFF?style=plastic&logo=42&logoColor=000000" alt="Intra 42"/></a></td>
   
  </tr>
</table>
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## Project
ft_transcendence is the final project of the 42 school curriculum, challenging students to create a fully-featured web application. This project focuses on building a single-page application which includes a real-time multiplayer game of pong and a live chat.

## Short demo
https://github.com/user-attachments/assets/7aa148a2-9c60-4426-bd4a-477e983b192f

## Features

### User Management Features:

- Sign up and login using their credentials,
- Sign up or login via the School 42 or Google OAuth API,
- Enable or disable 2FA,
- Customize their profile with a unique username and avatar,
- Change color theme,
- Add and remove friends,
- Block or unblock users,
- Keep track of their stats, match history and leaderboard ranking,
- Multiple language support (English, German, Urdu, Russian).
- manage users accounts via Admin panel

### Pong Game Features

- Responsive, 3D
- Remote and local play
- Online Tournament
- Inviting others to a game via chat

### Live Chat Features

- Creation of private chats between two users,
- Ability to block individual users so as not to see messages from blocked accounts
- Inviting the other person to a game of pong

## Technologies

- Frontend: [Angular 17](https://angular.dev/)
- Backend: [Django 5](https://www.djangoproject.com/)
  - API: [Django Rest Framework](https://www.django-rest-framework.org/)
  - WS: [Django Channels](https://channels.readthedocs.io/)
  - Database: [Postgresql](https://www.postgresql.org/)
  - Authorization: [Oauth 2.0](https://oauth.net/2/)
  - Password Hashing: [Argon2](https://github.com/P-H-C/phc-winner-argon2)
- API Documentation: [Swagger](https://swagger.io/)
- Web server: [NGINX](https://nginx.org/en/)
- Deployment: [Docker & Docker-Compose](https://www.docker.com/)

## HOW TO RUN

Run it on your Linux machine:
Before start, please replace marked variables in .env file in root directory with your own.
Then, run the following command:
```
make
```
To access site, go to localhost(by default) with port 4010 or your IP address(if your specified it in .env file):
```
https://localhost:4010
```
To access admin panel simply login as admin user with DJANGO_SUPERUSER credentials from .env file.
To access `pgadmin` site, use to 5432 port of localhost (or your IP address if your specified it before):
```
https://localhost:5432
```
To access API specification, use:
```
https://localhost:6010/api/schema/swagger-ui/
```
or 
```
https://localhost:6010/api/schema/redoc/
```
