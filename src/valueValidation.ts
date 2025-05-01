const regexTypes: { [key: string]: RegExp } = {
  string: /^('[^']*'|"[^"]*"|[^\s]+)$/,
  number: /^[+-]?\d+(\.\d+)?%?$/,
  boolean: /^(true|True|1|false|False|0)$/,
};

const errors: { [key: string]: string } = {
  string: "Invalid value, must be a string. No special characters allowed.",
  number: "Invalid value, must be a number.",
  boolean: "Invalid value, must be a boolean.",
  range: "Range values must be exactly 2 numbers.",
  number_list: "List can only contain numbers.",
  undefined:
    "Undefined validation type, if its used by DD and is missing, contact Zot, otherwise doubled check if its the correct value.",
};

export function validator(value: string, validationType: string) {
  switch (validationType) {
    case "string":
      return validateSimple(value, regexTypes["string"], errors["string"]);
    case "number":
      return validateSimple(value, regexTypes["number"], errors["number"]);
    case "boolean":
      return validateSimple(value, regexTypes["boolean"], errors["boolean"]);
    case "range":
      return validateRange(value);
    case "string_list":
      return validateList(value, "string");
    case "number_list":
      return validateList(value, "number");
    default:
      return { isValid: false, message: errors["undefined"] };
  }
}

function validateSimple(value: string, regex: RegExp, error: string) {
  const valid = regex.test(value);
  if (!valid) {
    return { isValid: false, message: error };
  }
  return { isValid: true, message: null };
}

function validateRange(range: string) {
  const items = range.split(/\s+/);
  if (items.length !== 2) {
    return { isValid: false, message: errors["range"] };
  }
  for (let item of items) {
    const result = validateSimple(item, regexTypes["number"], errors["number"]);
    if (!result.isValid) {
      return {
        isValid: false,
        message: `Range parameter "${item}" is invalid. ${errors["number"]}`,
      };
    }
  }
  return { isValid: true, message: null };
}

function validateList(list: string, listType: string) {
  const items = list.split(/\s+/);
  for (let item of items) {
    const result = validateSimple(item, regexTypes[listType], errors[listType]);
    if (!result.isValid) {
      return {
        isValid: false,
        message: `Item "${item}" is invalid. ${errors[listType]}`,
      };
    }
  }
  return { isValid: true, message: null };
}
