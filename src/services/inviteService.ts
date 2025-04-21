
// This is a mock service for generating and handling invitation links
// In a production environment, this would connect to a proper API

export const generateInviteLink = (inviteCode: string): string => {
  // Generate a shareable invite link
  const baseUrl = window.location.origin;
  return `${baseUrl}/complete-signup/${inviteCode}`;
};

export const generateWhatsAppMessage = (inviteCode: string, name: string): string => {
  const inviteLink = generateInviteLink(inviteCode);
  const message = `Hello ${name}, you have been invited to join Temple Book Sutra as an authorized personnel. Please click the link below to complete your registration: ${inviteLink}`;
  
  // Generate WhatsApp sharing link
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text: ", error);
    return false;
  }
};
