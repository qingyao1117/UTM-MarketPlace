/**
 * Cognito Pre-Sign-Up Lambda Trigger
 * 
 * Validates email domain during signup.
 * Only allows emails ending with @graduate.utm.my or @utm.my
 * 
 * Requirement: 1.1 - Email domain validation
 */

const ALLOWED_DOMAINS = JSON.parse(process.env.ALLOWED_DOMAINS || '["@graduate.utm.my", "@utm.my"]');

exports.handler = async (event) => {
  console.log('Pre-SignUp trigger received:', JSON.stringify(event, null, 2));

  const email = event.request.userAttributes.email;

  if (!email) {
    throw new Error('Email attribute not provided');
  }

  // Validate email domain
  const isValidDomain = ALLOWED_DOMAINS.some(domain => 
    email.toLowerCase().endsWith(domain)
  );

  if (!isValidDomain) {
    throw new Error(
      `Invalid email domain. Only emails ending with ${ALLOWED_DOMAINS.join(' or ')} are allowed.`
    );
  }

  // Auto-verify email for UTM domain emails
  event.response.autoConfirmUser = true;
  event.response.autoVerifiedAttributes = ['email'];

  console.log('Email validation passed:', email);

  return event;
};
