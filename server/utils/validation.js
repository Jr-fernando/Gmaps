import { isIP } from 'node:net';

const privateIpv4 = /^(10\.|127\.|0\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/;

export const isSafeExternalUrl = (rawUrl) => {
  try {
    const url = new URL(rawUrl);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1') return false;
    if (isIP(hostname) && privateIpv4.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
};
