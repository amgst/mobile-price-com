import type { Handler } from "@netlify/functions";
import express from "express";
import { registerRoutes } from "../../server/routes.js";

// Create Express app
const app = express();

// Register all routes
registerRoutes(app);

// Netlify function handler
const handler: Handler = async (event, context) => {
  // Convert Netlify event to Express request
  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;
  
  return new Promise((resolve) => {
    const mockReq = {
      url: path,
      method: method,
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : undefined,
      query: event.queryStringParameters || {}
    } as any;

    const mockRes = {
      statusCode: 200,
      headers: {},
      body: '',
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.body = JSON.stringify(data);
        this.headers['Content-Type'] = 'application/json';
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body
        });
        return this;
      },
      send: function(data: any) {
        this.body = typeof data === 'string' ? data : JSON.stringify(data);
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body
        });
        return this;
      },
      setHeader: function(name: string, value: string) {
        this.headers[name] = value;
        return this;
      }
    } as any;

    // Handle the request
    app(mockReq, mockRes);
  });
};

export { handler };