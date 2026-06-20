/**
 * Spam Detection Service
 * Detects and prevents spam in support tickets
 */

// Common spam keywords (marketing, SEO, suspicious patterns)
const SPAM_KEYWORDS = [
  // SEO/Marketing spam
  'seo', 'rank', 'google search', 'search engine', 'listing', 'index',
  'backlink', 'link building', 'traffic', 'visitors', 'promotion',
  'marketing service', 'advertise', 'advertisement', 'promote your',
  
  // Common spam phrases
  'click here', 'buy now', 'order now', 'limited time', 'act now',
  'best price', 'lowest price', 'free money', 'make money',
  'work from home', 'bitcoin investment', 'crypto mining',
  
  // Suspicious patterns
  'viagra', 'cialis', 'pharmacy', 'casino', 'poker',
  'dating', 'adult', 'xxx', 'porn',
  
  // Business solicitation
  'business proposal', 'partnership opportunity', 'investment opportunity',
  'join us', 'register now', 'sign up now',
  
  // Generic spam
  'dear sir/madam', 'dear webmaster', 'dear admin',
  'congratulations', 'you have won', 'claim your prize'
];

// Suspicious domain patterns
const SUSPICIOUS_DOMAINS = [
  '.xyz', '.top', '.club', '.info', '.biz',
  'bit.ly', 'tinyurl', 'short.link',
  'register', 'seo', 'marketing', 'promo'
];

// Disposable email domains (partial list)
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail', 'throwaway', 'guerrillamail', '10minutemail',
  'mailinator', 'maildrop', 'trashmail', 'yopmail',
  'fakeinbox', 'temp-mail', 'dispostable', 'burnermail'
];

const spamDetectionService = {
  /**
   * Main spam detection function
   * Returns { isSpam: boolean, reason: string, score: number }
   */
  detectSpam: (ticketData) => {
    const { subject, message, email, name } = ticketData;
    let spamScore = 0;
    const reasons = [];

    // 1. Check for spam keywords
    const keywordResult = spamDetectionService.checkSpamKeywords(subject + ' ' + message);
    spamScore += keywordResult.score;
    if (keywordResult.found.length > 0) {
      reasons.push(`Spam keywords detected: ${keywordResult.found.slice(0, 3).join(', ')}`);
    }

    // 2. Check for excessive links
    const linkResult = spamDetectionService.checkLinks(message);
    spamScore += linkResult.score;
    if (linkResult.count > 2) {
      reasons.push(`Excessive links detected: ${linkResult.count} links`);
    }

    // 3. Check for suspicious domains
    const domainResult = spamDetectionService.checkSuspiciousDomains(message);
    spamScore += domainResult.score;
    if (domainResult.found.length > 0) {
      reasons.push(`Suspicious domains: ${domainResult.found.join(', ')}`);
    }

    // 4. Check disposable email
    const emailResult = spamDetectionService.checkDisposableEmail(email);
    spamScore += emailResult.score;
    if (emailResult.isDisposable) {
      reasons.push('Disposable email address detected');
    }

    // 5. Check message quality
    const qualityResult = spamDetectionService.checkMessageQuality(message);
    spamScore += qualityResult.score;
    if (qualityResult.isSuspicious) {
      reasons.push(qualityResult.reason);
    }

    // 6. Check for generic greetings (common in spam)
    if (message.toLowerCase().includes('dear sir/madam') || 
        message.toLowerCase().includes('dear webmaster')) {
      spamScore += 15;
      reasons.push('Generic spam greeting detected');
    }

    // 7. Check for ALL CAPS (aggressive marketing)
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.5 && message.length > 50) {
      spamScore += 10;
      reasons.push('Excessive use of capital letters');
    }

    // 8. Check email and name mismatch patterns
    const nameEmailResult = spamDetectionService.checkNameEmailMismatch(name, email);
    spamScore += nameEmailResult.score;
    if (nameEmailResult.isSuspicious) {
      reasons.push(nameEmailResult.reason);
    }

    // Determine if spam based on score
    const isSpam = spamScore >= 30; // Threshold: 30 points = spam

    return {
      isSpam,
      score: spamScore,
      reasons: reasons.length > 0 ? reasons : ['Clean'],
      confidence: spamScore >= 50 ? 'high' : spamScore >= 30 ? 'medium' : 'low'
    };
  },

  /**
   * Check for spam keywords
   */
  checkSpamKeywords: (text) => {
    const lowerText = text.toLowerCase();
    const found = SPAM_KEYWORDS.filter(keyword => lowerText.includes(keyword));
    
    return {
      found,
      score: found.length * 5, // 5 points per keyword
      count: found.length
    };
  },

  /**
   * Check for links in message
   */
  checkLinks: (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = text.match(urlRegex) || [];
    
    let score = 0;
    if (links.length > 0) score += 5;
    if (links.length > 2) score += 15; // Excessive links
    if (links.length > 4) score += 20; // Way too many links
    
    return {
      count: links.length,
      links,
      score
    };
  },

  /**
   * Check for suspicious domains
   */
  checkSuspiciousDomains: (text) => {
    const found = [];
    const lowerText = text.toLowerCase();
    
    SUSPICIOUS_DOMAINS.forEach(domain => {
      if (lowerText.includes(domain)) {
        found.push(domain);
      }
    });
    
    return {
      found,
      score: found.length * 10,
      count: found.length
    };
  },

  /**
   * Check if email is disposable
   */
  checkDisposableEmail: (email) => {
    const lowerEmail = email.toLowerCase();
    const isDisposable = DISPOSABLE_EMAIL_DOMAINS.some(domain => 
      lowerEmail.includes(domain)
    );
    
    return {
      isDisposable,
      score: isDisposable ? 20 : 0
    };
  },

  /**
   * Check message quality (too short, too long, gibberish)
   */
  checkMessageQuality: (message) => {
    let score = 0;
    let isSuspicious = false;
    let reason = '';

    // Too short (likely spam or useless)
    if (message.length < 20) {
      score += 10;
      isSuspicious = true;
      reason = 'Message too short';
    }

    // Too long (likely copy-paste spam)
    if (message.length > 2000) {
      score += 10;
      isSuspicious = true;
      reason = 'Message excessively long';
    }

    // Repeated characters (e.g., "!!!!!!!" or "aaaaaaa")
    const repeatedCharsRegex = /(.)\1{5,}/g;
    if (repeatedCharsRegex.test(message)) {
      score += 15;
      isSuspicious = true;
      reason = 'Repeated characters detected';
    }

    // Too many emojis or special characters
    const specialCharRatio = (message.match(/[^a-zA-Z0-9\s.,!?]/g) || []).length / message.length;
    if (specialCharRatio > 0.3) {
      score += 10;
      isSuspicious = true;
      reason = 'Excessive special characters';
    }

    return { score, isSuspicious, reason };
  },

  /**
   * Check for name/email mismatch patterns
   */
  checkNameEmailMismatch: (name, email) => {
    let score = 0;
    let isSuspicious = false;
    let reason = '';

    // Random/gibberish name patterns
    const gibberishPattern = /^[a-z]{10,}$/i; // Long string of letters
    if (gibberishPattern.test(name.replace(/\s/g, ''))) {
      score += 10;
      isSuspicious = true;
      reason = 'Suspicious name pattern';
    }

    // Generic names commonly used by spammers
    const genericNames = ['admin', 'webmaster', 'marketing', 'seo team', 'support'];
    if (genericNames.some(gen => name.toLowerCase().includes(gen))) {
      score += 5;
      isSuspicious = true;
      reason = 'Generic spam name';
    }

    return { score, isSuspicious, reason };
  },

  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if content contains common support ticket patterns (legitimate)
   */
  hasLegitimatePatterns: (ticketData) => {
    const { subject, message } = ticketData;
    const combined = (subject + ' ' + message).toLowerCase();

    const legitimatePatterns = [
      'cannot login', 'forgot password', 'withdrawal issue', 'deposit',
      'account locked', 'verification', 'kyc', 'two factor', '2fa',
      'transaction', 'order', 'trade', 'balance', 'wallet',
      'help', 'issue', 'problem', 'error', 'not working'
    ];

    return legitimatePatterns.some(pattern => combined.includes(pattern));
  }
};

export default spamDetectionService;
