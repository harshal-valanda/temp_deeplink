#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment variables mapping
const replacements = {
  '{ CLOUDFRONT_URL }': process.env.CLOUDFRONT_URL || '',
  '{ ANDROID_SCHEME }': process.env.ANDROID_SCHEME || '',
  '{ ANDROID_PACKAGE_NAME }': process.env.ANDROID_PACKAGE_NAME || '',
  '{ ANDROID_PLAY_STORE_URL }': process.env.ANDROID_PLAY_STORE_URL || '',
  '{ IOS_SCHEME }': process.env.IOS_SCHEME || '',
  '{ IOS_APP_STORE_URL }': process.env.IOS_APP_STORE_URL || '',
  '{ WEB_REDIRECT_URL }': process.env.WEB_REDIRECT_URL || '',
};

// Function to replace placeholders in a file
function replaceInFile(filePath, isJavaScript = true) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  Object.keys(replacements).forEach(placeholder => {
    const value = replacements[placeholder];
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    
    if (content.includes(placeholder)) {
      let replacement;
      
      if (isJavaScript) {
        // For JS files (config.js, script.js): wrap in quotes and escape single quotes
        // Example: { CLOUDFRONT_URL } → 'https://example.com'
        replacement = `'${(value || '').replace(/'/g, "\\'")}'`;
      } else {
        // For HTML files (index.html): use as-is without quotes
        // Example: { CLOUDFRONT_URL } → https://example.com
        replacement = value || '';
      }
      
      content = content.replace(regex, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${path.basename(filePath)} has been updated with environment variables`);
  }
}

// Replace placeholders in all files
// config.js - Replaces placeholders with quoted strings (e.g., { CLOUDFRONT_URL } → 'https://example.com')
// script.js - Replaces placeholders with quoted strings (same as config.js)
// index.html - Replaces placeholders without quotes (e.g., { CLOUDFRONT_URL } → https://example.com)
const filesToProcess = [
  { path: path.join(__dirname, 'config.js'), isJS: true },
  { path: path.join(__dirname, 'script.js'), isJS: true },
  { path: path.join(__dirname, 'index.html'), isJS: false },
];

filesToProcess.forEach(file => {
  if (fs.existsSync(file.path)) {
    replaceInFile(file.path, file.isJS);
  } else {
    console.warn(`Warning: ${file.path} not found, skipping...`);
  }
});

console.log('Environment variable replacement completed!');

