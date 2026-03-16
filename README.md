
# AWS CDK Website Homework – EC2 and RDS Deployment

## Student

Juliette Ngum
University of St. Thomas
Software Engineering Program

---

# Project Overview

This project uses **AWS Cloud Development Kit (CDK)** to deploy a scalable web architecture on AWS.

The infrastructure is defined using **TypeScript** and deployed through **AWS CloudFormation**.

The stack automatically provisions:

* A **Virtual Private Cloud (VPC)**
* **Public and Private Subnets across 2 Availability Zones**
* **Two EC2 Web Servers**
* **One MySQL RDS Database**
* **Security Groups for controlled network access**

---

# Architecture

The infrastructure consists of the following components:

### VPC

* Custom VPC deployed across **2 Availability Zones**

### Subnets

* **Public Subnets**

  * Used for EC2 web servers
* **Private Subnets**

  * Used for the RDS database

### EC2 Web Servers

Two **Amazon Linux EC2 instances** are deployed in the public subnets.

Each server automatically installs Apache and serves a simple web page.

Example output:

Hello from Server 0
Hello from Server 1

---

### RDS Database

A **MySQL RDS instance** is deployed in the private subnets.

Configuration includes:

* MySQL Engine
* Port **3306**
* Database name: `homeworkdb`
* Credentials stored in **AWS Secrets Manager**

---

# Security Configuration

### Web Server Security Group

Allows:

* **HTTP (Port 80)** from anywhere

```
0.0.0.0/0 → Port 80
```

### RDS Security Group

Allows:

* **MySQL (Port 3306)** only from the Web Server Security Group

```
WebServerSG → Port 3306
```

This ensures the database **cannot be accessed from the internet**.

---

# Deployment Steps

Install dependencies:

```
npm install
```

Build the project:

```
npm run build
```

Deploy the infrastructure:

```
cdk deploy
```

---

# Outputs

After deployment, the following outputs are generated:

* WebServer0PublicIP
* WebServer1PublicIP
* RdsEndpoint
* RdsPort

These allow testing of the deployed infrastructure.

---

# Testing the Web Servers

Open in browser:

```
http://WebServer0PublicIP
http://WebServer1PublicIP
```

Each instance should display a simple HTML page confirming the server is running.

---

# Clean Up Resources

To avoid AWS charges, destroy the stack after testing:

```
cdk destroy
```

Confirm when prompted.

---

# Technologies Used

* AWS CDK
* TypeScript
* Amazon EC2
* Amazon RDS (MySQL)
* AWS CloudFormation
* Amazon VPC
* AWS Secrets Manager

---

# Repository

GitHub Repository:

https://github.com/juliettengum/cdk-website-homework

---
