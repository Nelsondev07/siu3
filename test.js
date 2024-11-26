//URL: projects/project-eduinsight-87-97d42/locations/us-central1/agents/8c20be8f-b5f5-4647-a240-e0cd45db6678

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const { SessionsClient } = require('@google-cloud/dialogflow-cx');

// Initialize Firebase Admin with the credentials file
admin.initializeApp({
  credential: admin.credential.cert('./firebase-credentials.json')
});

// Set up Dialogflow CX client
const projectId = process.env.DIALOGFLOW_PROJECT_ID;  
const location = process.env.DIALOGFLOW_LOCATION || 'us-central1'; 
const agentId = process.env.DIALOGFLOW_AGENT_ID;
const environment = 'Draft'; // Replace with your Dialogflow CX environment ID (e.g., 'draft' or 'production')
const query = 'Hola';     // Example query 
const languageCode = 'es';              // Use 'es' for Spanish
const sessionId = Math.random().toString(36).substring(7);

// Set up Express server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins or replace "*" with your Android app's IP if needed
    methods: ["GET", "POST"], // Allow the necessary methods
    allowedHeaders: ["my-custom-header"], // Optional
    credentials: true // Allow credentials if necessary (e.g., cookies, authentication)
  },
  transports: ['websocket'] 
});

app.use(bodyParser.json()); // This is needed to parse JSON requests

// Create session client and path
const client = new SessionsClient({
    apiEndpoint: 'us-central1-dialogflow.googleapis.com'  // Specify the correct regional endpoint
  });

// Specify your flow version and session path
const sessionPath = client.projectLocationAgentEnvironmentSessionPath(
  projectId,
  location,
  agentId,
  environment,
  sessionId
);

// Specify the flow version (can be 'draft' or the version of the flow)
const flowVersion = 'default'; // check version created manually.

// Start listening for new socket connections
io.on('connection', (client) => {
    // Listen for 'new_message' events from the client
      socket.on('new_message', async (chatMessage) => {
      console.log('Received new message:', chatMessage); // Check this log
      const response = await sendToDialogflowCX(chatMessage.message);
      console.log('Dialogflow response:', response); // Log the response from Dialogflow
      
      // Send the response from Dialogflow back to the client
      socket.emit('broadcast', response);
    
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
    console.log('A user disconnected');
    });
  }
);


app.get('/', (req, res) => {
  res.send('Server is running');
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    // Log the entire request body to inspect its structure
    console.log("Received Webhook Request Body:", JSON.stringify(request.body, null, 2));
    
    // Safely access the parameters from the request
    const parameters = request.body.queryResult && request.body.queryResult.parameters;
    console.log(parameters);

    if (parameters) {
      const age = parameters['edad']; // This captures the 'edad' parameter from the user's response
  
      if (age) {
        // Process the age (e.g., adding 10 years)
        const futureAge = parseInt(age) + 10;
  
        // Respond with a message
        const response = {
          fulfillmentText: `Tu edad dentro de 10 años será ${futureAge}.`,
        };
  
        // Send the response back to Dialogflow
        return res.json({ fulfillmentText: response.fulfillmentText });
      } else {
        // If no age was provided, ask again
        return res.json({
          fulfillmentText: 'Lo siento, no entendí tu edad. ¿Cuál es tu edad?',
        });
      }
    } else {
      // If parameters are not found in the request body
      return res.json({
        fulfillmentText: 'No pude encontrar la edad en tu respuesta. ¿Puedes decirme tu edad?',
      });
    }
  });

// Function to send message to Dialogflow CX and get the response
async function sendToDialogflowCX(message) {
    // Generate a random session ID for the conversation
    const sessionId = Math.random().toString(36).substring(7);
  
    // Set up the session path
    const sessionPath = client.projectLocationAgentEnvironmentSessionPath(
      projectId, 
      location, 
      agentId, 
      environment, 
      sessionId
    );
  
    // Construct the request object for Dialogflow CX
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
        },
        languageCode: languageCode,
      },
    };
  
    try {
      // Send the query to Dialogflow CX
      const [response] = await client.detectIntent(request);
      
      // Check if there are response messages
      if (response.queryResult && response.queryResult.responseMessages) {
        // Extract the text response
        const responseMessages = response.queryResult.responseMessages;
        let responseText = '';
  
        // Iterate over all response messages (in case there are multiple)
        responseMessages.forEach(message => {
          if (message.text && message.text.text) {
            responseText += message.text.text.join(' ');
          }
        });
  
        console.log('Dialogflow CX response:', responseText);
        return responseText; // Return the concatenated response text
      } else {
        return "Sorry, I couldn't understand that. Could you try again?";
      }
    } catch (error) {
      console.error('Error communicating with Dialogflow CX:', error);
      return "Sorry, there was an error processing your request.";
    }
  }

// Start the server  at http://localhost:3000/webhook
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`server running at ${PORT}...`)
})

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);

//     //handleDebugInput();
    
// });

const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
      },
      languageCode: languageCode,
    },
    body:
      {   
          queryResult: {
              parameters: {
              edad: '25', // Example test parameter (age)
              },
          },
      }
    //flowVersion,  // This line specifies the flow version
  };


// Send a test request to the webhook endpoint after starting the server
const sendTestRequest = () => {
  const url = 'http://localhost:3000/webhook'; // Local server URL for webhook endpoint
  const requestBody = {
    queryResult: {
      parameters: {
        edad: '25', // Example test parameter (age)
      },
    },
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log('Response from webhook:', data);
    })
    .catch((error) => {
      console.error('Error sending test request:', error);
    });
};


const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Handle user input and send to Dialogflow CX
async function handleDebugInput() {
  // Await user input
  const msg = await new Promise(resolve => {
      readline.question('Make sure to resolve any question that you have! (Type "q" to quit): ', resolve);
  });

  if (msg.toLowerCase() === "q") {
      console.log('Exiting the chat...');
      readline.close();
  } else {
      // Send to Dialogflow CX and wait for the response
      const response = await sendToDialogflowCX(msg);
      console.log(response);  // Log the response from Dialogflow CX
      handleDebugInput();  // Recursively call to ask for more input
  }
}
