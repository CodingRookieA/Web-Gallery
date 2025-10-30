🌐 Web Gallery

Web Gallery is a full-stack web application that allows users to share, browse, and comment on pictures — similar to platforms like Instagram or Google Photos.
This project focuses on secure user authentication, authorization, and modern deployment using HTTPS with a multi-containerized Docker setup.

The live demo can be found at: https://hw3-codingrookiea.amazingcloud.space/

🚀 Overview

Web Gallery enables authenticated users to create and manage their own galleries while browsing others’. The application integrates both frontend and backend services, containerized and orchestrated with Docker Compose, and deployed on a DigitalOcean virtual machine using HTTPS.

🔧 Key Features

User Authentication & Authorization

Secure sign-up, sign-in, and session management using Express sessions

Access control:

Unauthenticated users cannot view any gallery content

Authenticated users can browse all galleries

Users can upload/delete images only in their own galleries

Users can comment on any image, and delete their own comments

Gallery owners can moderate (delete) any comment on their pictures

Personal Galleries

Each user owns a unique gallery

Images and comments are associated with their respective gallery owners

RESTful API

Built with Node.js and Express

Structured endpoints for galleries, images, and comments

Session-based authentication for secure access

Frontend

Developed using HTML, CSS, and JavaScript

Responsive gallery interface for uploading, browsing, and commenting

Integrated with backend APIs for seamless interaction

Deployment

Fully containerized using Docker Compose

Nginx Reverse Proxy and acme-companion for automatic HTTPS certificates (Let’s Encrypt)

Frontend (static files) and Backend (Express API) deployed on the same domain via HTTPS

Hosted on DigitalOcean VM:

https://hw3-github_username.amazingcloud.space


(Replace github_username with your own)

🏗️ Architecture

The system runs four main containers managed by Docker Compose:

Container	Description
nginx-proxy	Reverse proxy handling HTTP/HTTPS requests
acme-companion	Automatically generates and renews TLS certificates
frontend	NGINX container serving static files (HTML, CSS, JS)
backend	Node.js + Express API server (handles authentication, galleries, comments)

The reverse proxy routes HTTPS traffic to the appropriate container.
Requests to /api/ are directed to the backend, while other paths serve static frontend files.

🧩 Tech Stack

Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Database: NeDB (@seald-io/nedb)
Deployment: Docker, NGINX, Let’s Encrypt, DigitalOcean
Security: HTTPS, Sessions, Environment Variables
