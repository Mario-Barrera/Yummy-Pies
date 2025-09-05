function validateStep1(action) {
  if (action === 'continue') {
    const isValid = true;
    return isValid; // link only works if this is true
  }
  return false;
}
