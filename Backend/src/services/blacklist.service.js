import { query } from '../config/db.config.js';

/**
 * Blacklist Service
 * Manages email and IP blacklists for spam prevention
 */

const blacklistService = {
  /**
   * Check if email is blacklisted
   */
  isEmailBlacklisted: async (email) => {
    try {
      const result = await query(
        'SELECT id, reason FROM email_blacklist WHERE email = $1 AND is_active = true',
        [email.toLowerCase()]
      );
      
      return {
        isBlacklisted: result.rows.length > 0,
        reason: result.rows[0]?.reason || null
      };
    } catch (error) {
      console.error('Email blacklist check error:', error);
      return { isBlacklisted: false, reason: null };
    }
  },

  /**
   * Check if IP is blacklisted
   */
  isIPBlacklisted: async (ipAddress) => {
    try {
      const result = await query(
        'SELECT id, reason FROM ip_blacklist WHERE ip_address = $1 AND is_active = true',
        [ipAddress]
      );
      
      return {
        isBlacklisted: result.rows.length > 0,
        reason: result.rows[0]?.reason || null
      };
    } catch (error) {
      console.error('IP blacklist check error:', error);
      return { isBlacklisted: false, reason: null };
    }
  },

  /**
   * Check if email domain is blacklisted
   */
  isEmailDomainBlacklisted: async (email) => {
    try {
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) return { isBlacklisted: false, reason: null };

      const result = await query(
        'SELECT id, reason FROM email_domain_blacklist WHERE domain = $1 AND is_active = true',
        [domain]
      );
      
      return {
        isBlacklisted: result.rows.length > 0,
        reason: result.rows[0]?.reason || null,
        domain
      };
    } catch (error) {
      console.error('Email domain blacklist check error:', error);
      return { isBlacklisted: false, reason: null };
    }
  },

  /**
   * Add email to blacklist
   */
  addEmailToBlacklist: async (email, reason, addedBy = null) => {
    try {
      const result = await query(
        `INSERT INTO email_blacklist (email, reason, added_by, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (email) DO UPDATE SET
           reason = EXCLUDED.reason,
           added_by = EXCLUDED.added_by,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [email.toLowerCase(), reason, addedBy]
      );
      
      return { success: true, id: result.rows[0].id };
    } catch (error) {
      console.error('Add email to blacklist error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add IP to blacklist
   */
  addIPToBlacklist: async (ipAddress, reason, addedBy = null) => {
    try {
      const result = await query(
        `INSERT INTO ip_blacklist (ip_address, reason, added_by, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (ip_address) DO UPDATE SET
           reason = EXCLUDED.reason,
           added_by = EXCLUDED.added_by,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [ipAddress, reason, addedBy]
      );
      
      return { success: true, id: result.rows[0].id };
    } catch (error) {
      console.error('Add IP to blacklist error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add email domain to blacklist
   */
  addDomainToBlacklist: async (domain, reason, addedBy = null) => {
    try {
      const result = await query(
        `INSERT INTO email_domain_blacklist (domain, reason, added_by, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (domain) DO UPDATE SET
           reason = EXCLUDED.reason,
           added_by = EXCLUDED.added_by,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [domain.toLowerCase(), reason, addedBy]
      );
      
      return { success: true, id: result.rows[0].id };
    } catch (error) {
      console.error('Add domain to blacklist error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove email from blacklist
   */
  removeEmailFromBlacklist: async (email) => {
    try {
      await query(
        'UPDATE email_blacklist SET is_active = false WHERE email = $1',
        [email.toLowerCase()]
      );
      return { success: true };
    } catch (error) {
      console.error('Remove email from blacklist error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all blacklisted emails (admin only)
   */
  getAllBlacklistedEmails: async (limit = 100, offset = 0) => {
    try {
      const result = await query(
        `SELECT id, email, reason, added_by, created_at, updated_at
         FROM email_blacklist
         WHERE is_active = true
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('Get blacklisted emails error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if ticket should be auto-blocked
   */
  shouldBlockTicket: async (ticketData, ipAddress) => {
    const { email } = ticketData;

    // Check email blacklist
    const emailCheck = await blacklistService.isEmailBlacklisted(email);
    if (emailCheck.isBlacklisted) {
      return {
        shouldBlock: true,
        reason: `Email blacklisted: ${emailCheck.reason}`,
        type: 'email_blacklist'
      };
    }

    // Check email domain blacklist
    const domainCheck = await blacklistService.isEmailDomainBlacklisted(email);
    if (domainCheck.isBlacklisted) {
      return {
        shouldBlock: true,
        reason: `Email domain blacklisted: ${domainCheck.reason}`,
        type: 'domain_blacklist'
      };
    }

    // Check IP blacklist
    if (ipAddress) {
      const ipCheck = await blacklistService.isIPBlacklisted(ipAddress);
      if (ipCheck.isBlacklisted) {
        return {
          shouldBlock: true,
          reason: `IP address blacklisted: ${ipCheck.reason}`,
          type: 'ip_blacklist'
        };
      }
    }

    return { shouldBlock: false, reason: null, type: null };
  }
};

export default blacklistService;
