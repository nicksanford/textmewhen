var expect = require("expect.js");
var request = require("superagent");
var apiServer = require("../server")

describe("The textmewhen API", function () {

  before(function () {
    apiServer.listen(8080)
  })

  after(function () {
    apiServer.close()
  })

  it("should return a 422 error when sent an enpty JSON POST", function (done) {
    request.post('localhost:8080/api/v1/uber').send({}).end(function (res) {
      expect(res).to.exist;
      expect(res.status).to.equal(422);
      done();
    });
  });

  it("should return a 201 code response when sent a correctly formatted JSON POST", function (done) {
    request.post('localhost:8080/api/v1/uber').send({"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445,"start_longitude":-97.74403,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}).end(function (res) {
      expect(res).to.exist;
      expect(res.status).to.equal(201);
      done();
    });
  });
});
