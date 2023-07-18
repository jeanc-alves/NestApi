- [ ] Cada usuário poderá ser cadastrado em apenas um único curso.

- [ ] Cada curso poderá ter várias atividades.

- [ ] Cada atividade terá a possibilidade de anexar diversos documentos, somente, em pdf

- [ ] Deverá ter um sistema para download de todos os anexos de uma mesma atividade de uma só vez.

- [ ] O cadastro de usuários e cursos poderá, apenas, ser feito por um administrador autenticado.

- [ ] Ao cadastrar uma nova atividade é necessário que seja enviado para uma fila do RabbitMQ para ser consumida pela aplicação frontend (Não é necessário ter um consumidor, apenas que o serviço de mensageria esteja funcionando). Além de uma notificação por e-mail para os alunos cadastrados no respectivo curso.
