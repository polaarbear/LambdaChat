# LambdaChat
A chat application built to demonstrate serverless technology.  These files can save a lot of time
in setting up a messaging application on AWS Lambda that supports individual user accounts with
token-based account validation.

# Front-End
The front end UI is incredibly rudimentary, just a bare-basics HTML project with minimal usage of
Bootstrap mainly for buttons and the necessary pages to create and confirm an account, log-in,
and send and receive messages. It could easily be replaced by a front-end JS framework of your
choosing.  The bulk of the useful code is in the JavaScript files.

# Back-End
The back end of this project is done in Node.js.  It communicates to an AWS DynamoDB database
to send and retrieve messages sent between users, and to allow users to look up available
users to which they can send messages.  Routing is handled by the AWS API Gateway Service

# Setup
There are several locations within the project that will need data edited before they are ready
for deployment.  I have marked them with a note that uses two minus signs at the start and end
of the missing information.  An example is in the frontend/js/config.js file where there are
two lines

--user pool id goes here--
--client id goes here--

You will need to replace all of these lines with the relevant information for your own personal
AWS account.  Affected files will include

1. frontend/js/config.js

2. backend/policies (all 3 policies)

You will need to make sure that you have the relevant services set up as you go along, for
example to access the ARN numbers for your DynamoDB you will have to have it set up already,
and the same will be true for the AWS Cognito Identity services.

Set up each of the functions in the backend/lambda folder to enable the storing and retrieving
of messages using the Node.js back-end option.

The api-gateway/Mappings and api-gateway/Models folders are examples of how you can map front-end
queries to match your back-end database schema in DynamoDB, it should be relatively easy to
customize to match your own naming and query schema.

Once all of the services are running, you also need to add each item in the backend/policies
folder to your AWS account so that all of the different services can communicate with each other.


There will likely be some additional troubleshooting as you go along, AWS is a rapidly changing
environment.  I built this project over the course of a couple weekends to demo the Lambda tech,
and half the battle was just locating all the different dependencies and the (mostly) boilerplate
methods to log in and out using their identity service. I thought it might save someone (or my
future self) from having to do all the leg-work again in the future.
