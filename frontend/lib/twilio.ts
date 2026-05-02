import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

if (!accountSid || !authToken || !verifyServiceSid) {
  console.warn('Twilio environment variables are missing. SMS verification will fail.')
}

const client = twilio(accountSid, authToken)

/**
 * Sends a verification code to the given phone number via Twilio Verify.
 * @param phoneNumber The phone number in E.164 format (e.g., +1234567890)
 */
export async function sendVerificationCode(phoneNumber: string) {
  try {
    const verification = await client.verify.v2.services(verifyServiceSid!)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' })
    
    return { success: true, status: verification.status }
  } catch (error: any) {
    console.error('[Twilio] Error sending verification code:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verifies the code entered by the user.
 * @param phoneNumber The phone number in E.164 format
 * @param code The 6-digit code entered by the user
 */
export async function checkVerificationCode(phoneNumber: string, code: string) {
  try {
    const verificationCheck = await client.verify.v2.services(verifyServiceSid!)
      .verificationChecks
      .create({ to: phoneNumber, code: code })
    
    return { 
      success: verificationCheck.status === 'approved', 
      status: verificationCheck.status 
    }
  } catch (error: any) {
    console.error('[Twilio] Error checking verification code:', error)
    return { success: false, error: error.message }
  }
}
