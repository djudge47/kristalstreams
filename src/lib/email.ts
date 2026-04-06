import { Resend } from 'resend';
import { supabase } from './supabase';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

interface EmailSettings {
  id: string;
  name: string;
  email: string;
  display_name: string;
  reply_to: string | null;
}

export async function sendEmail(
  templateName: string,
  to: string,
  variables: Record<string, string>
) {
  try {
    // Get template and settings from database
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (templateError) throw templateError;

    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('name', 'noreply')
      .single();

    if (settingsError) throw settingsError;

    // Replace variables in template
    let subject = template.subject;
    let body = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    });

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `${settings.display_name} <${settings.email}>`,
      to: [to],
      subject: subject,
      html: body,
      reply_to: settings.reply_to || undefined
    });

    if (error) throw error;

    // Log email
    await supabase.from('email_logs').insert({
      template_id: template.id,
      recipient: to,
      subject: subject,
      body: body,
      status: 'sent'
    });

    return data;
  } catch (error) {
    console.error('Error sending email:', error);

    // Log error
    await supabase.from('email_logs').insert({
      template_id: null,
      recipient: to,
      subject: 'Error sending email',
      body: error instanceof Error ? error.message : 'Unknown error',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

export async function sendSupportEmail(
  userId: string,
  subject: string,
  message: string
) {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get support email settings
    const { data: settings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('name', 'support')
      .single();

    if (settingsError) throw settingsError;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `${settings.display_name} <${settings.email}>`,
      to: [settings.email],
      reply_to: profile.email,
      subject: `Support Request: ${subject}`,
      html: `
        <h2>Support Request from ${profile.full_name || profile.email}</h2>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><strong>User Details:</strong></p>
        <ul>
          <li>Email: ${profile.email}</li>
          <li>Name: ${profile.full_name || 'Not provided'}</li>
          <li>Subscription: ${profile.subscription_tier}</li>
        </ul>
      `
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error sending support email:', error);
    throw error;
  }
}