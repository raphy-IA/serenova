import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { prisma } from '../../config/database';

export const documentService = {
    async generatePdfFromTemplate(templateType: string, data: any): Promise<Buffer> {
        // Fetch Template from the database
        const template = await prisma.documentTemplate.findFirst({
            where: { type: templateType as any }
        });

        // Use a default basic template if not found in the DB yet
        const htmlContentTemplate = template?.contentHtml || `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                    h1 { color: #2563eb; }
                    .metadata { margin-bottom: 20px; color: #666; font-size: 0.9em; }
                    .content { margin-top: 40px; line-height: 1.6; }
                    .footer { margin-top: 60px; font-size: 0.8em; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                <h1>Document Automatique: {{titre}}</h1>
                <div class="metadata">Généré le: {{dateGeneration}}</div>
                
                <div class="content">
                    <h3>Locataire: {{locataire.nom}} {{locataire.prenom}}</h3>
                    <p>Ce document est généré de manière automatique par SÉRÉNOVA pour confirmer les informations liées à 
                    l'espace <strong>{{espace.identifiant}}</strong> sur le site <strong>{{site.nom}}</strong>.</p>
                    
                    {{#if isBail}}
                        <h4>Détails du Bail</h4>
                        <ul>
                            <li>Date Entrée: {{bail.dateEntree}}</li>
                            <li>Loyer: {{bail.loyerMensuel}} FCFA</li>
                            <li>Statut: {{bail.statut}}</li>
                        </ul>
                    {{/if}}

                    {{#if isPaiement}}
                        <h4>Détails du Paiement</h4>
                        <ul>
                            <li>Montant: {{paiement.montant}} FCFA</li>
                            <li>Date: {{paiement.datePaiement}}</li>
                            <li>Mode: {{paiement.modePaiement}}</li>
                        </ul>
                        <h2 style="color: #10b981; border: 2px solid #10b981; padding: 10px; display: inline-block;">PAYÉ</h2>
                    {{/if}}
                </div>
                
                <div class="footer">SÉRÉNOVA SaaS - Logiciel de gestion immobilière de pointe.</div>
            </body>
            </html>
        `;

        // Parse HTML with Handlebars and inject data
        const compiledTemplate = handlebars.compile(htmlContentTemplate);
        const htmlContent = compiledTemplate(data);

        // Render PDF using Puppeteer
        const browser = await puppeteer.launch({
            // args: ['--no-sandbox', '--disable-setuid-sandbox'] 
            headless: true
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Return a Buffer (Puppeteer returns Uint8Array in newer versions, which is compatible with Buffer)
        const pdfUint8Array = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
        });

        await browser.close();
        return Buffer.from(pdfUint8Array);
    }
};
