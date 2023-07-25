export const html = (userName, courseName) => {
  return `<html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Aviso de Atividade Criada</title>
    </head>
    <body>
      <h1>Aviso de Atividade Criada</h1>
      <p>Olá ${userName},</p>
      <p>Uma nova atividade foi criada no curso de ${courseName}.</p>
      <p>
        Por favor, acesse o ambiente virtual de aprendizagem para verificar os
        detalhes da atividade.
      </p>
      <p>Atenciosamente,</p>
      <p>Equipe do Curso</p>
    </body>
  </html>`;
};
