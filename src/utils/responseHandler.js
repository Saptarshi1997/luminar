class responseHandler {
    constructor(
        statusCode,
        data,
        message = "Success",
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

module.exports = responseHandler;
