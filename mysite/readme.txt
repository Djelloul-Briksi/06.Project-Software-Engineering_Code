Running application with docker compose
---------------------------------------

cd \path-to\mysite
docker compose up

-> site is accessible: http://127.0.0.1:8000/cab/cab

Choose a mobileSQLite database: -> database.db
Select a train number: -> '450'
Click on a complex action to see details: -> ActionID: 1101
Click on a node to collapse or expand it
Hover and stay on a node to see some details

-> tested on windows 10, with docker desktop v4.34.2
-> and virtual machine ubuntun 20.04, with ...


Creating and Push a Docker Image on AWS
----------------------------------------

start 'Docker Desktop'

delete any previous Image

cd \path-to\mysite
docker compose create

-> image is created (and visible in Docker Desktop)

create a container repository on AWS Elastic Container Repository (ECR)
namespace: djelloul-briksi-iu
repo name: cab

AWS 'view push commands' tell you what to do next

aws ecr get-login-password --region eu-west-3 | docker login --username AWS --password-stdin 869935097551.dkr.ecr.eu-west-3.amazonaws.com

docker tag mysite-web:latest 869935097551.dkr.ecr.eu-west-3.amazonaws.com/djelloul-briksi-iu/cab:latest

-> image is visible on AWS ECR 


Create an AWS AppRunner with a Docker Image
-------------------------------------------

Copy Image URI from AWR ECR Repository

AWS App Runner

Create service: Container Registry, Amazo ECR

Container Image URI: Docker Image URI

Create new service role or choose existing

Port: 8000

Next

Create & deploy


