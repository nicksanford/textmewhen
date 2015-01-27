var expect = require("expect.js");
var models = require("../models");

describe("uberRequestModel", function () {

  it("should succeed when params are well formed", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445,"start_longitude":-97.74403,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.not.be.ok()
      done()
    });
  })

  it("should fail when email is missing", function (done) {
    var testParams = {"end_longitude":-97.80056218972445,"start_longitude":-97.74403,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("email")
      expect(err.errors.email.type).to.eql("required")
      done()
    });
  })

  it("should fail when email not well formed", function (done) {
    var testParams = {"email":"the.ronin.poetgmail.com","end_longitude":-97.80056218972445,"start_longitude":-97.74403,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("email")
      expect(err.errors.email.type).to.eql("regexp")
      done()
    });
  })

  it("should fail when end_longitude is missing", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com", "start_longitude":-97.74403,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("end_longitude")
      expect(err.errors.end_longitude.type).to.eql("required")
      done()
    });
  })

  it("should fail when end_longitude is not a number", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":"aasdf", "start_longitude":-97.74403,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("end_longitude")
      expect(err.errors.end_longitude.type).to.eql("required")
      done()
    });
  })

  it("should fail when start_longitude is missing", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("start_longitude")
      expect(err.errors.start_longitude.type).to.eql("required")
      done()
    });
  })

  it("should fail when start_longitude is not a number", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445, "start_longitude":"a;klsjdf","start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("start_longitude")
      expect(err.errors.start_longitude.type).to.eql("required")
      done()
    });
  })

  it("should fail when start_latitude is missing", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445,"start_longitude":-97.74403,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("start_latitude")
      expect(err.errors.start_latitude.type).to.eql("required")
      done()
    });
  })

  it("should fail when start_latitude is not a number", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445,"start_longitude":-97.74403,"start_latitude":"akljdsf","desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z","end_latitude":30.36127041635577}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("start_latitude")
      expect(err.errors.start_latitude.type).to.eql("required")
      done()
    });
  })

  it("should fail when end_latitude is missing", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445,"start_longitude":-97.74403,"start_latitude":30.26463,"desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z"}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("end_latitude")
      expect(err.errors.end_latitude.type).to.eql("required")
      done()
    });
  })

  it("should fail when end_latitude is not a number", function (done) {
    var testParams = {"email":"the.ronin.poet@gmail.com","end_longitude":-97.80056218972445,"start_longitude":-97.74403,"start_latitude":30.26463,"end_latitude":"kaljsdf","desired_price":15.641957825939231,"end_time":"2015-01-27T01:50:48.416Z"}
    new models.UberRequest(testParams).validate(function (err) {
      expect(err).to.be.ok()
      expect(err.errors).to.only.have.key("end_latitude")
      expect(err.errors.end_latitude.type).to.eql("required")
      done()
    });
  })

})
