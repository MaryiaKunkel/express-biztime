/** Server startup for BizTime. */
// server.js

const app = require("./app");

app.listen(3000, function () {
  console.log("Listening on 3000");
});
