import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export class CdkWebsiteHomeworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with 2 AZs, each having public and private subnets
    const vpc = new ec2.Vpc(this, 'HomeworkVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Security group for web servers
    const webSG = new ec2.SecurityGroup(this, 'WebServerSG', {
      vpc,
      description: 'Allow HTTP from anywhere',
      allowAllOutbound: true,
    });

    webSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    // Security group for RDS
    const rdsSG = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Allow MySQL only from web servers',
      allowAllOutbound: true,
    });

    rdsSG.addIngressRule(
      webSG,
      ec2.Port.tcp(3306),
      'Allow MySQL from web server security group only'
    );

    // Create one EC2 instance in each public subnet
    const publicSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PUBLIC,
    });

    publicSubnets.subnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebServer${index}`, {
        vpc,
        vpcSubnets: { subnets: [subnet] },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: webSG,
      });

      instance.addUserData(
        '#!/bin/bash',
        'dnf update -y',
        'dnf install -y httpd',
        'systemctl enable httpd',
        'systemctl start httpd',
        `echo "<h1>Hello from Server ${index}</h1>" > /var/www/html/index.html`
      );

      new cdk.CfnOutput(this, `WebServer${index}PublicIP`, {
        value: instance.instancePublicIp,
      });
    });

    // RDS subnet group using all private subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      description: 'Subnet group for RDS in private subnets',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // MySQL RDS instance
    const db = new rds.DatabaseInstance(this, 'HomeworkMySQL', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      subnetGroup: dbSubnetGroup,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      multiAz: false,
      publiclyAccessible: false,
      securityGroups: [rdsSG],
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      databaseName: 'homeworkdb',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: db.dbInstanceEndpointAddress,
    });

    new cdk.CfnOutput(this, 'RdsPort', {
      value: db.dbInstanceEndpointPort,
    });
  }
}