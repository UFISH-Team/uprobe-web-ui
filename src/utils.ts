import React from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';

import { FolderChain } from "./types";


export const getAlertCloseHandler = (setAlertOpen: (o: boolean) => void) => {

  const handleAlertClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
  };

  return handleAlertClose

}

export const folderChainToStr = (fc: FolderChain) => {
  const path = fc.map((f: any) => (f).name).join("/")
  return path
}

export const downloadFile = (fileName:string, fileContent: Blob) => {
  const url = window.URL.createObjectURL(
    new Blob([fileContent])
  )
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
}


export const selectLocalFile = () => {
  // see https://stackoverflow.com/a/73552508/8500469
  let lock = false
  return new Promise<FileList>((resolve, reject) => {
    const el = document.createElement('input');
    el.id = (new Date()).toString();
    el.style.display = 'none';
    el.setAttribute('type', 'file');
    el.setAttribute('multiple', "")
    document.body.appendChild(el)

    el.addEventListener('change', () => {
      lock = true;
      resolve(el.files as FileList)
      document.body.removeChild(el);
    }, { once: true })

    window.addEventListener('focus', () => { // file blur
      setTimeout(() => {
        if (!lock && document.getElementById(el.id)) {
          reject(new Error('onblur'))
          document.body.removeChild(el)
        }
      }, 300)
    }, { once: true })
    el.click() // open file select box
  })
}


export const getAxiosInstance = (serverAddr: string) => {
  const cookies = new Cookies();
  const authToken = cookies.get('Authorization');

  let instance = axios.create({
    withCredentials: true,
    baseURL: serverAddr,
    headers: {
      'Authorization': authToken,
    }
  })
  return instance
}

// Authentication and token management utilities
export const AUTH_CONFIG = {
  // Token expiration time in milliseconds (7 days)
  TOKEN_EXPIRY_DURATION: 7 * 24 * 60 * 60 * 1000,
  // Warning time before expiration (no longer used for popup)
  EXPIRY_WARNING_DURATION: 20 * 60 * 1000,
};

/**
 * Get token from storage (check both localStorage and sessionStorage)
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Get token expiration from storage
 */
export const getTokenExpiration = (): string | null => {
  return localStorage.getItem('tokenExpiration') || sessionStorage.getItem('tokenExpiration');
};

/**
 * Check if the current token is expired
 */
export const isTokenExpired = (): boolean => {
  const tokenExpiration = getTokenExpiration();
  if (!tokenExpiration) return true;
  
  const expirationTime = parseInt(tokenExpiration);
  const currentTime = Date.now();
  
  return currentTime > expirationTime;
};

/**
 * Get remaining time until token expires
 */
export const getTokenRemainingTime = (): number => {
  const tokenExpiration = getTokenExpiration();
  if (!tokenExpiration) return 0;
  
  const expirationTime = parseInt(tokenExpiration);
  const currentTime = Date.now();
  
  return Math.max(0, expirationTime - currentTime);
};

/**
 * Format remaining time into readable string
 */
export const formatRemainingTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Expired';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Check if token is about to expire (within warning duration)
 */
export const isTokenExpiringSoon = (): boolean => {
  const remainingTime = getTokenRemainingTime();
  return remainingTime > 0 && remainingTime <= AUTH_CONFIG.EXPIRY_WARNING_DURATION;
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('rememberMe');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('isAuthenticated');
  sessionStorage.removeItem('tokenExpiration');
};

/**
 * Check if user chose to be remembered
 */
export const isRememberMeEnabled = (): boolean => {
  return localStorage.getItem('rememberMe') === 'true';
};

/**
 * Process avatar URL, ensure returning full URL
 */
export const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
  if (!avatarUrl) return null;
  
  // If already full URL, return directly
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  // If relative path, add API server address
  const API_BASE_URL = 'http://127.0.0.1:8000';
  return `${API_BASE_URL}${avatarUrl}`;
};
