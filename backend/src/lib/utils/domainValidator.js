const validDomains = ["gmail.com", "yahoo.com", "outlook.com"];

const isValidEmailDomain = (email) => {
  if (typeof email !== "string") return false;
  const domain = email.trim().split("@")[1];
  return Boolean(domain) && validDomains.includes(domain.toLowerCase());
};

export { isValidEmailDomain };
