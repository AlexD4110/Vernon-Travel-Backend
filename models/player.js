function buildPlayerPayload(body) {
  return {
    playerFirstName: body.playerFirstName,
    playerLastName: body.playerLastName,
    parentName: body.parentName,
    email: body.email,
    gradeLevel: body.gradeLevel,
    phone: body.phone,
    gender: body.gender,
    address: {
      street: body.street,
      town: body.town,
      state: body.state,
      zip: body.zip,
    },
    emergencyContactName: body.emergencyContactName,
    emergencyContactNumber: body.emergencyContactNumber,
    registrationDate: new Date().toISOString(),
  };
}

module.exports = {
  buildPlayerPayload,
};
