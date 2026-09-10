import { GcpCredentials } from "@/types/erosion";
import { getGoogleAccessToken, EARTH_ENGINE_SCOPES } from "./googleAuth";
import { initializeEarthEngine } from "./earthEngineClient";

export interface EarthEngineVerification {
  success: boolean;
  error?: string;
  status?: number;
  data?: {
    projectId: string;
    clientEmail: string;
    scopes: string[];
    timestamp: string;
  };
}

/**
 * Verificação real, de ponta a ponta, de uma Service Account: assina o JWT,
 * troca por access_token no Google, e confirma que o Earth Engine está
 * habilitado no projeto inicializando o cliente oficial (@google/earthengine).
 * Compartilhada por `/api/auth/gee-test` (teste sem persistir nada) e
 * `/api/auth/gee-session` (teste + criação de sessão de servidor).
 */
export async function verifyEarthEngineAccess(credentials: GcpCredentials): Promise<EarthEngineVerification> {
  if (!credentials.private_key.includes("BEGIN PRIVATE KEY") || !credentials.private_key.includes("END PRIVATE KEY")) {
    return { success: false, status: 400, error: "Chave privada GCP malformada ou truncada." };
  }

  // 1. Validação OAuth2 junto aos servidores centrais do Google
  try {
    await getGoogleAccessToken(credentials, EARTH_ENGINE_SCOPES);
  } catch (authErr: any) {
    return { success: false, status: 401, error: `Falha de autenticação OAuth2 junto ao Google: ${authErr.message}` };
  }

  // 2. Validação e inicialização direta junto à API do Google Earth Engine
  try {
    await initializeEarthEngine(credentials);
    return {
      success: true,
      data: {
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
        scopes: EARTH_ENGINE_SCOPES,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (eeErr: any) {
    return {
      success: false,
      status: 403,
      error: `Autenticação OK, mas o Earth Engine rejeitou o acesso ao projeto "${credentials.project_id}": ${eeErr.message}. Verifique se o Earth Engine foi registrado para este projeto GCP em https://code.earthengine.google.com/register`,
    };
  }
}

