const apiResponses = {
  error_200: (body: { [key: string]: any }, event: {}) => {
    let responseBody = {
      message: body,
      input: event,
    };
    let response = {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(responseBody),
    };
    console.log("response: " + JSON.stringify(response));
    return response;
  },
  error_400: (body: { [key: string]: any }, event: {} ) => {
    let responseBody = {
      message: body,
      input:event
    };
    let response = {
      statusCode: 400,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(responseBody),
    };
    console.log("response: " + JSON.stringify(response));
    return response;
  },
};

export default apiResponses;
