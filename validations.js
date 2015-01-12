var validation = {
  passesValidations: function (validationSchema, jsonToBeValidated) {
    if (validationSchema.validate(jsonToBeValidated).isError()) {
      return false;
    } else {
      return true;
    }
  },
  validationErrors: function (validationSchema, jsonToBeValidated) {
    var validation = validationSchema.validate(jsonToBeValidated)
    if (validation.isError()) {
      return validation._errors;
    } else {
      return false;
    }
  },
  isJsonString: function (str) {
    try {
      var parsedJson = JSON.parse(str);
      if (parsedJson && typeof parsedJson === "object" && parsedJson !== null) {
        return parsedJson;
      }
    } catch (e) {
      return false;
    }
    return false;
  }
}


module.exports = validation;