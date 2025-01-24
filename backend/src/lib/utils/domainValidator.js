const validDomains = ["gmail.com", "yahoo.com", "outlook.com"];

const isValidEmailDomain = (email) => {
  const domain = email.split("@")[1];
  return validDomains.includes(domain);
};

export { isValidEmailDomain };
