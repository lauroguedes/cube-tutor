import type { CourseText } from '../types';

// Texto do curso em português do Brasil. Os marcadores ({{move R}} etc.) são
// os mesmos do inglês e disparam na palavra seguinte. A notação é falada como
// se diz no Brasil ("R linha", "F dois"); as teclas mostram os símbolos.
// O formato da cruz amarela é "barra" (não "linha", para não confundir com R linha).
// O texto é o mesmo para as duas vozes, então o tutor nunca usa palavras com
// gênero sobre si mesmo ("obrigado/obrigada") nem sobre quem aprende ("sozinho").

export const ptBr: CourseText = {
  parts: {
    1: 'O cubo',
    2: 'Movendo o cubo',
    3: 'Resolvendo',
    4: 'Por conta própria',
  },

  lessons: {
    welcome: { title: 'Boas-vindas', summary: 'Como este curso funciona, e o seu primeiro giro.' },
    history: { title: 'De onde veio o cubo', summary: 'Um professor de design, um quebra-cabeça por acaso e um número enorme.' },
    anatomy: { title: 'Conheça as peças', summary: 'Centros, arestas e quinas, e o segredo lá dentro.' },
    turning: { title: 'Girando uma face', summary: 'O que um giro faz, e o que ele deixa como está.' },
    notation: { title: 'A linguagem dos movimentos', summary: 'Seis letras que descrevem qualquer giro.' },
    pieces: { title: 'Siga uma peça', summary: 'O hábito que deixa todo o resto fácil.' },
    'first-algorithm': { title: 'Seu primeiro algoritmo', summary: 'Quatro movimentos que voltam para casa.' },
    plan: { title: 'O plano', summary: 'Resolver uma camada de cada vez, de baixo para cima.' },
    daisy: { title: 'A margarida', summary: 'Junte as arestas brancas em volta do centro amarelo.' },
    cross: { title: 'A cruz branca', summary: 'Mande cada pétala para o seu lugar.' },
    corners: { title: 'Quinas brancas', summary: 'Termine a primeira camada, uma quina de cada vez.' },
    middle: { title: 'A camada do meio', summary: 'Dois algoritmos espelhados para quatro arestas.' },
    'yellow-cross': { title: 'A cruz amarela', summary: 'Ponto, L, barra, cruz.' },
    'yellow-corners': { title: 'Quinas amarelas no lugar', summary: 'Coloque cada quina onde ela pertence.' },
    'twist-corners': { title: 'Torça as quinas', summary: 'O passo em que você precisa confiar no processo.' },
    'last-edges': { title: 'As últimas arestas', summary: 'Um algoritmo, e o cubo está resolvido.' },
    'full-solve': { title: 'Resolva por conta própria', summary: 'Um cubo todo embaralhado, do começo ao fim.' },
  },

  steps: {
    // ── Boas-vindas ──
    'welcome-intro': {
      say: `Oi. Eu vou te ensinar a resolver o cubo. Nas próximas aulas, você vai sair do zero e chegar a resolver um cubo por conta própria.
        Não é preciso ter pressa, nem ter jeito para quebra-cabeças. Só um pouco de paciência.
        {{autorotate off}}{{view default}}Funciona assim. Eu explico, e o cubo na sua tela mostra o que eu quero dizer.
        Você também pode mexer nele. Arraste o espaço vazio em volta para olhar de qualquer lado. {{highlight layer:R}}E arraste uma face para girá-la. {{highlight none}}
        Algumas aulas terminam com uma pequena tarefa. Conclua a tarefa, e a próxima aula se abre. Se você tiver um cubo de verdade, pegue e acompanhe comigo.`,
    },
    'welcome-try': {
      say: `Vamos começar com o seu primeiro movimento. Arraste qualquer face do cubo, em qualquer direção, e solte.`,
      done: `Isso. Você acabou de fazer o seu primeiro giro.`,
      hints: [
        'Pressione um dos quadradinhos coloridos e deslize o dedo ou o mouse pelo cubo.',
        'No teclado, você também pode apertar a tecla R.',
      ],
    },

    // ── História: uma narrativa, as cenas acompanham a narração ──
    'history-story': {
      say: `{{scene year}}Em 1974, em Budapeste, um jovem professor chamado {{scene rubik}}Ernő Rubik dava aulas de design e arquitetura.
        Ele queria um jeito de mostrar aos alunos como os objetos podem se mover em três dimensões.
        {{scene blocks}}{{explode on}}Então ele construiu um pequeno cubo feito de blocos menores, {{explode off}}que podia girar em todas as direções sem se desmontar.
        Depois, ele girou o cubo algumas vezes. {{moves R U F'}} E mais algumas. {{moves L D' B}}
        {{scene month}}Desfazer aquilo foi muito mais difícil do que ele esperava. Ele levou cerca de um mês para resolver a própria invenção.
        {{scene timeline:1}}Ele o chamou de Cubo Mágico. {{scene timeline:2}}O cubo chegou às lojas de brinquedos da Hungria em 1977, {{scene timeline:3}}e em 1980 foi lançado no mundo todo com um novo nome: o cubo de Rubik.
        Ele se tornou um dos quebra-cabeças mais vendidos da história.
        {{state home: R U F' L D' B2 R' U2 F D2 L'}}{{scene patterns}}Veja por que ele é tão difícil. Um cubo como este pode ser embaralhado em mais de quarenta e três quintilhões de combinações diferentes. É quarenta e três, seguido de dezoito zeros.
        {{scene universe}}Se você testasse uma combinação por segundo, levaria cerca de cem vezes a idade do universo.
        {{state home}}{{scene one}}E só uma dessas combinações está resolvida.
        Então, como alguém consegue resolver? Não é sorte.
        {{scene championship}}Em 1982, o primeiro campeonato mundial aconteceu em Budapeste. O vencedor resolveu o cubo em menos de vinte e três segundos.
        {{scene gods-number}}Em 2010, pesquisadores usaram computadores para provar que qualquer cubo embaralhado pode ser resolvido em vinte movimentos ou menos.
        {{scene method}}Você não vai precisar de nada disso. Você vai aprender um método: alguns passos, feitos em ordem, usando um punhado de sequências curtas de movimentos chamadas algoritmos.
        É assim que todo mundo aprende. E até o fim deste curso, você também vai conseguir.`,
    },

    // ── As peças ──
    'anatomy-core': {
      say: `Vamos olhar de perto. Parece uma pilha de cubinhos, mas tem um segredo lá dentro.
        {{explode on}}Separe as peças, e não há nenhum cubinho no meio. Há um núcleo, com três eixos.
        {{highlight type:center}}As seis peças centrais ficam nas pontas desses eixos. Elas podem girar no lugar, mas nunca se afastam umas das outras.
        {{explode off}}É por isso que o branco fica sempre oposto ao amarelo, o verde oposto ao azul, e o vermelho oposto ao laranja.
        E isso quer dizer algo útil: o centro mostra a cor da face inteira. {{highlight none}}`,
    },
    'anatomy-pieces': {
      say: `{{highlight type:edge}}Estas são as arestas. São doze, e cada uma tem duas cores.
        {{highlight type:corner}}Estas são as quinas. São oito, e cada uma tem três cores.
        {{highlight none}}Os giros mudam as peças de lugar, mas uma quina continua sempre sendo quina, e uma aresta continua sempre sendo aresta.
        Então você nunca resolve adesivos, na verdade. Você resolve peças, e cada peça tem exatamente um lugar certo.`,
    },
    'anatomy-corners': {
      say: `Sua vez. Encontre as oito quinas e toque em cada uma. Algumas estão atrás, então você vai precisar olhar em volta do cubo.`,
      done: `Todas as oito. Quinas são as peças com três cores.`,
      hints: [
        'As quinas ficam nas pontas do cubo, onde três faces se encontram.',
        'Arraste o espaço vazio em volta do cubo para ver as quinas de trás e de baixo.',
      ],
    },
    'anatomy-edge': {
      say: `Agora o cubo está um pouco embaralhado. Encontre a aresta branca e verde, e toque nela.`,
      done: `Exatamente. E o lugar dela é entre o centro branco e o centro verde.`,
      hints: ['Uma aresta tem exatamente duas cores. Procure uma com branco e verde.', 'Tente olhar o cubo pelo lado direito e por baixo.'],
    },

    // ── Girando ──
    'turning-faces': {
      say: `Cada giro move uma camada de nove peças e deixa o resto como está.
        Olhe o cubo de frente. {{highlight layer:R}}Esta é a face direita.
        {{arrow R}}Girar no sentido horário, como se você olhasse direto para o lado direito, faz a coluna da frente subir. {{move R}}Assim.
        {{arrow none}}{{move R'}}E este é o sentido anti-horário, para o outro lado.
        {{highlight none}}Agora observe os centros. {{moves U F}}Não importa como você gire, eles continuam no mesmo lugar.`,
    },
    'turning-try': {
      say: `Agora é com você. Gire a face direita no sentido horário, para a coluna da frente subir.`,
      done: `Perfeito. Esse é um giro horário da face direita.`,
      hints: ['Coloque o dedo na coluna direita da face da frente e arraste para cima.', 'No teclado, aperte R.'],
    },
    'turning-back': {
      say: `Agora gire de volta, no sentido anti-horário, para o cubo ficar resolvido de novo.`,
      done: `Boa. Todo giro pode ser desfeito girando a mesma face para o outro lado.`,
      hints: ['Arraste a coluna direita da face da frente para baixo.', 'No teclado, segure Shift e aperte R.'],
    },

    // ── Notação ──
    'notation-letters': {
      say: `Quem resolve o cubo escreve os movimentos com letras, uma para cada face. As letras vêm do inglês.
        {{highlight layer:F}}F, de front, a frente. {{highlight layer:B}}B, de back, a parte de trás. {{highlight layer:U}}U, de up, em cima. {{highlight layer:D}}D, de down, embaixo.
        {{highlight layer:L}}L, de left, a esquerda. {{highlight layer:R}}E R, de right, a direita. {{highlight none}}
        Uma letra sozinha significa um quarto de volta no sentido horário, como se você olhasse direto para aquela face.
        {{keys R}}{{move R}}R. {{keys U}}{{move U}}U. {{keys F}}{{move F}}F. {{keys none}}`,
    },
    'notation-prime': {
      say: `Um pequeno traço depois da letra, chamado linha, significa sentido anti-horário.
        {{keys R'}}{{move R'}}R linha. {{keys U'}}{{move U'}}U linha.
        O número dois significa meia volta. {{keys F2}}{{move F2}}F dois. {{keys none}}{{move F2}}
        Uma dica que evita muita confusão. Nas faces esquerda, de baixo e de trás, o sentido horário continua sendo visto daquele lado.
        {{arrow L}}Então o L faz a coluna da frente descer, {{move L}}e não subir. {{arrow none}}`,
    },
    'notation-try': {
      say: `Sua vez de ler. Faça U, e depois R linha.`,
      done: `Isso mesmo. Você acabou de seguir uma notação escrita.`,
      hints: [
        'U gira a face de cima, então a fileira da frente vai para a esquerda.',
        'R linha gira a face direita para a coluna da frente descer.',
      ],
    },
    'notation-read': {
      say: `Mais uma, um pouco maior. F, depois U dois, depois L linha.`,
      done: `Ótimo. Se você consegue ler isso, consegue ler qualquer algoritmo.`,
      hints: [
        'F gira a face da frente no sentido horário, como um volante virando para a direita.',
        'U dois é meia volta na face de cima. L linha faz subir a coluna esquerda da face da frente.',
      ],
    },

    // ── Siga uma peça ──
    'pieces-follow': {
      say: `Este é o hábito mais útil de quem resolve o cubo: seguir uma peça.
        {{highlight piece:white,green}}Observe a aresta branca e verde. {{move F}}O F leva essa peça para baixo, até o lado direito.
        {{move U}}Agora o U gira a camada de cima, mas a nossa aresta não está mais nela, então ela não se mexe.
        {{move U'}}{{move F'}}Desfaça esses giros, e ela volta para casa. {{highlight none}}
        Antes de cada giro, faça duas perguntas. O que se move? E o que fica parado?`,
    },
    'pieces-try': {
      say: `Leve a aresta branca e verde para a parte de baixo da face da frente. Ela pode ficar virada de qualquer jeito.`,
      done: `Isso. Meia volta na face da frente moveu exatamente a peça que você queria.`,
      hints: ['A aresta está na face da frente. Quais giros movem as peças da face da frente?', 'Tente girar a face da frente duas vezes.'],
    },

    // ── Primeiro algoritmo ──
    'alg-meet': {
      say: `Um algoritmo é uma sequência curta de movimentos que você pode repetir. Aqui está o mais famoso.
        {{keys R U R' U'}}R, U, R linha, U linha. {{moves R U R' U'}}
        Algumas peças se moveram, mas a maior parte do cubo continua resolvida.
        Agora vem a surpresa. {{moves (R U R' U')5}}Se você repetir seis vezes seguidas, tudo volta exatamente para onde começou.
        {{keys none}}Essa é a grande ideia por trás da resolução. Um algoritmo move algumas peças de um jeito conhecido, enquanto todo o resto volta para casa.`,
    },
    'alg-try': {
      say: `Sua vez. Faça R, U, R linha, U linha, uma vez.`,
      done: `Muito bem. Repare quais peças mudaram e quais ficaram.`,
      hints: ['R faz a coluna da frente subir. U gira a camada de cima para a esquerda.', 'R linha faz a coluna direita descer, e U linha gira a camada de cima de volta para a direita.'],
    },
    'alg-six': {
      say: `Agora continue repetindo até o cubo ficar resolvido de novo. Deve levar mais cinco vezes.`,
      done: `Resolvido. Você acabou de sentir como um algoritmo funciona.`,
      hints: ['Continue: R, U, R linha, U linha.', 'Conte as repetições. Mais cinco trazem o cubo de volta ao começo.'],
    },

    // ── O plano ──
    'plan-layers': {
      say: `Agora segure o cubo com o centro branco embaixo, o amarelo em cima e o verde virado para você. Vamos chamar isso de posição de resolução.
        Vamos resolver o cubo uma camada de cada vez, de baixo para cima, como quem constrói uma casa.
        {{highlight pieces:white,green;white,orange;white,blue;white,red}}Primeiro, uma cruz branca embaixo.
        {{highlight pieces:white,green,orange;white,green,red;white,blue,orange;white,blue,red}}Depois, as quatro quinas brancas, que completam a primeira camada.
        {{highlight pieces:green,orange;green,red;blue,orange;blue,red}}Depois, as quatro arestas da camada do meio.
        {{highlight layer:U}}E por fim, a camada amarela em cima, em quatro passos curtos. {{highlight none}}
        Cada passo preserva o que você já fez. Vamos começar.`,
    },

    // ── Margarida ──
    'daisy-goal': {
      say: `A cruz branca começa com uma forma chamada margarida.
        {{highlight pieces:white,green;white,orange;white,blue;white,red}}É o centro amarelo em cima, cercado por quatro arestas brancas, como pétalas em volta de uma flor. Os adesivos brancos ficam todos virados para cima.
        As outras cores das pétalas ainda não importam. Só precisamos de quatro pétalas brancas.
        {{highlight none}}{{view default}}A margarida é fácil de montar, porque em cima é onde você consegue ver o que está fazendo.`,
    },
    'daisy-rules': {
      say: `Para montar, encontre uma aresta branca e leve ela para cima, com o branco virado para cima.
        {{state daisy: R'}}{{highlight piece:white,orange}}Se a aresta estiver na camada do meio, gire a face lateral que leva o adesivo branco para cima. {{move R}}Aqui, é o R.
        {{state daisy: R2}}Se a aresta estiver embaixo, com o branco virado para baixo, gire essa face duas vezes. {{move R2}}
        {{highlight none}}E se o adesivo branco estiver virado para o lado, um giro leva a peça para a camada do meio, e aí você sobe ela como antes.
        Só tem uma regra. Antes de subir uma peça, gire a camada de cima para que o lugar onde ela vai entrar ainda não tenha uma pétala. Senão, você derruba essa pétala.`,
    },
    'daisy-try-middle': {
      say: `Três pétalas estão prontas. Encontre a quarta aresta branca na camada do meio e suba ela.`,
      done: `Uma margarida completa.`,
      hints: ['A aresta branca está na face da frente, na fileira do meio, à direita.', 'Gire a face direita no sentido horário para subir a peça: R.'],
    },
    'daisy-try-bottom': {
      say: `Desta vez, a última aresta branca está embaixo. Lembre da regra antes de subir.`,
      done: `Boa. Você protegeu a sua pétala primeiro.`,
      hints: [
        'Olhe embaixo do cubo: a aresta branca está embaixo, do lado direito.',
        'O lugar acima dela já tem uma pétala. Gire a camada de cima uma vez primeiro, e depois gire a face direita duas vezes.',
      ],
    },
    'daisy-try-full': {
      say: `Agora monte uma margarida inteira a partir de um cubo embaralhado. Sem pressa, e lembre da regra.`,
      done: `Essa margarida foi você que montou.`,
      hints: [
        'Encontre uma aresta branca que ainda não seja pétala e veja em qual situação ela está.',
        'Camada do meio: suba com um giro. Embaixo, com o branco para baixo: gire duas vezes. Branco virado para o lado: primeiro um giro.',
        'Antes de subir, gire a camada de cima para deixar o lugar livre.',
      ],
    },

    // ── Cruz ──
    'cross-flip': {
      say: `Agora cada pétala desce para a parte de baixo.
        {{highlight piece:white,green}}Escolha uma pétala e olhe a outra cor dela. Esta é verde.
        {{move U'}}Gire a camada de cima até o adesivo verde ficar logo acima do centro verde.
        {{move F2}}Depois, gire essa face duas vezes. A aresta branca chega embaixo, exatamente no lugar dela.
        {{highlight none}}Faça o mesmo com as outras três pétalas: alinhe, e depois dois giros.`,
    },
    'cross-try': {
      say: `Sua vez. Desça as quatro pétalas para formar a cruz branca.`,
      done: `Essa é a cruz branca.`,
      hints: [
        'Gire a camada de cima até a cor lateral de uma pétala combinar com o centro abaixo dela.',
        'Depois gire essa face duas vezes. Repita para cada pétala.',
      ],
    },
    'cross-check': {
      say: `Vamos olhar por baixo. {{view bottom}}Uma cruz branca, e a cor lateral de cada aresta combina com o centro ao lado. É essa segunda parte que faz dela uma cruz de verdade.
        {{view default}}{{highlight none}}Uma camada começada. Agora, as quinas.`,
    },

    // ── Quinas brancas ──
    'corners-drop': {
      say: `Agora as quatro quinas brancas, com o branco ainda embaixo.
        {{highlight piece:white,green,orange}}Esta quina pertence ao lugar entre os centros branco, verde e laranja. Agora, ela está esperando logo acima do lugar dela.
        Segure o cubo de modo que esse lugar fique na frente, à direita, embaixo.
        {{keys R U R' U'}}Agora repita o algoritmo que você já conhece: R, U, R linha, U linha. {{moves (R U R' U')3}}
        Continue repetindo até a quina encaixar com o branco embaixo. Leva uma, três ou cinco vezes, dependendo de como ela está virada.
        {{keys none}}{{highlight none}}`,
    },
    'corners-find': {
      say: `Se a quina estiver em outro lugar da camada de cima, gire a camada de cima primeiro.
        {{highlight piece:white,green,orange}}{{move U'}}Leve a quina para logo acima do lugar dela, entre as suas cores. {{moves R U R' U'}}Depois repita o algoritmo.
        {{highlight none}}E se uma quina branca estiver presa na camada de baixo, no lugar errado, faça o algoritmo uma vez naquele lugar. Ele joga a quina para cima, e aí você pode encaixá-la direito.`,
    },
    'corners-try': {
      say: `Sua vez. A última quina está esperando acima do lugar dela. Repita o algoritmo até ela encaixar.`,
      done: `A primeira camada está completa.`,
      hints: [
        'Segure a quina na frente, à direita, acima do lugar dela.',
        'Repita R, U, R linha, U linha até o branco ficar embaixo. Pode levar cinco vezes.',
      ],
    },
    'corners-try-align': {
      say: `Esta quina ainda não está acima do lugar dela. Leve ela até lá primeiro, e depois encaixe.`,
      done: `Muito bem. Alinhe, e depois repita.`,
      hints: ['Gire a camada de cima até a quina ficar entre as próprias cores, na frente à direita.', 'Depois repita R, U, R linha, U linha.'],
    },
    'corners-try-all': {
      say: `Agora as quatro quinas precisam ser encaixadas. Termine a primeira camada inteira.`,
      done: `Uma primeira camada completa. Isso é uma conquista de verdade.`,
      hints: [
        'Escolha uma quina branca na camada de cima e veja as outras duas cores dela.',
        'Gire a camada de cima até ela ficar acima do lugar entre esses dois centros, e segure esse lugar na frente, à direita.',
        'Repita R, U, R linha, U linha. Se uma quina estiver presa embaixo no lugar errado, faça o algoritmo uma vez para tirá-la de lá.',
      ],
    },

    // ── Camada do meio ──
    'middle-right': {
      say: `Agora, a camada do meio: quatro arestas sem amarelo.
        {{highlight piece:green,orange}}Encontre uma aresta da camada de cima sem amarelo. Gire a camada de cima até a cor da frente dela combinar com o centro abaixo. Aqui é verde sobre verde, como um T de cabeça para baixo.
        Agora olhe a cor de cima. Laranja. O centro laranja está à direita, então a aresta vai para a direita.
        {{keys U R U' R' U' F' U F}}U, R, U linha, R linha, U linha, F linha, U, F. {{moves U R U' R' U' F' U F}}
        {{keys none}}{{highlight none}}Ela desce para a camada do meio, e a sua primeira camada fica intacta.`,
    },
    'middle-left': {
      say: `{{highlight piece:green,red}}Se a cor de cima combinar com o centro da esquerda, use a versão espelhada.
        {{keys U' L' U L U F U' F'}}U linha, L linha, U, L, U, F, U linha, F linha. {{moves U' L' U L U F U' F'}}
        {{keys none}}{{highlight none}}Lado direito ou lado esquerdo, é a mesma ideia, espelhada.
        E se uma aresta estiver presa na camada do meio virada ao contrário, encaixe qualquer aresta de cima naquele lugar para tirá-la de lá.`,
    },
    'middle-try-right': {
      say: `Sua vez. Esta aresta precisa ir para a direita.`,
      done: `Direto para o lugar.`,
      hints: ['A aresta já está alinhada na frente. A cor de cima dela combina com o centro da direita.', 'Faça U, R, U linha, R linha, U linha, F linha, U, F.'],
    },
    'middle-try-left': {
      say: `E esta vai para a esquerda.`,
      done: `Versão espelhada, feito.`,
      hints: ['A cor de cima dela combina com o centro da esquerda.', 'Faça U linha, L linha, U, L, U, F, U linha, F linha.'],
    },
    'middle-try-all': {
      say: `Agora resolva a camada do meio inteira. Você vai precisar olhar em volta do cubo para achar todas as arestas.`,
      done: `Duas camadas resolvidas. Só falta a camada amarela.`,
      hints: [
        'Encontre uma aresta de cima sem amarelo. Gire a camada de cima até a cor da frente dela combinar com o centro abaixo.',
        'Cor de cima igual ao centro da direita: use o algoritmo da direita. Centro da esquerda: use o da esquerda.',
        'Arestas atrás? Olhe o cubo por aquele lado e trate-o como a frente. Se uma aresta estiver presa no meio virada ao contrário, encaixe qualquer aresta de cima ali para tirá-la.',
      ],
    },

    // ── Cruz amarela ──
    'yc-cases': {
      say: `Hora da última camada. Primeiro, uma cruz amarela em cima. Olhe só para as arestas amarelas e ignore as quinas.
        Você vai ver uma de três formas. Um ponto, um L, ou uma barra.
        {{keys F R U R' U' F'}}Se você vir um ponto, faça F, R, U, R linha, U linha, F linha. {{moves F R U R' U' F'}}Agora você tem um L.
        {{state grip: F U R U' R' F' F U R U' R' F'}}Segure o L apontando para trás e para a esquerda, assim, e faça de novo. {{moves F R U R' U' F'}}Agora é uma barra.
        Segure a barra deitada, da esquerda para a direita, e mais uma vez. {{moves F R U R' U' F'}}Uma cruz amarela.
        {{keys none}}`,
    },
    'yc-try-line': {
      say: `Aqui está uma barra, já deitada da esquerda para a direita. Forme a cruz.`,
      done: `Da barra para a cruz.`,
      hints: ['A barra já vai da esquerda para a direita.', 'Faça F, R, U, R linha, U linha, F linha.'],
    },
    'yc-try-l': {
      say: `Agora um L. Ele já está apontando para trás e para a esquerda. Leve até a cruz.`,
      done: `L, barra, cruz. Você pegou o jeito.`,
      hints: ['Faça o algoritmo uma vez para transformar o L em uma barra.', 'Depois faça mais uma vez com a barra deitada, da esquerda para a direita.'],
    },
    'yc-try-dot': {
      say: `E por fim, um ponto. Vá do ponto até a cruz por conta própria.`,
      done: `Do ponto à cruz. Esse é o passo inteiro.`,
      hints: [
        'Faça o algoritmo uma vez para conseguir um L.',
        'Gire a camada de cima para o L apontar para trás e para a esquerda, e faça de novo para conseguir uma barra.',
        'Segure a barra deitada, da esquerda para a direita, e faça uma última vez.',
      ],
    },

    // ── Quinas amarelas no lugar ──
    'ycp-intro': {
      say: `Agora, coloque as quinas amarelas nos lugares certos. Não se preocupe ainda com o lado para onde elas estão viradas.
        Uma quina está no lugar quando as suas três cores combinam com os três centros em volta dela, mesmo que esteja torcida.
        {{highlight piece:yellow,green,orange}}Esta está no lugar. Segure o cubo com ela na frente, à direita, em cima.
        {{keys U R U' L' U R' U' L}}U, R, U linha, L linha, U, R linha, U linha, L. {{moves U R U' L' U R' U' L}}
        A quina da frente à direita fica parada, e as outras três trocam de lugar. Repita até as quatro estarem em casa.
        {{keys none}}{{highlight none}}Se nenhuma quina estiver no lugar, faça o algoritmo uma vez de qualquer posição, e uma delas vai ficar.`,
    },
    'ycp-try': {
      say: `Uma quina já está no lugar. Segure ela na frente, à direita, e coloque as outras três no lugar.`,
      done: `As quatro quinas estão no lugar.`,
      hints: [
        'A quina amarela, verde e laranja já está em casa, na frente à direita.',
        'Faça U, R, U linha, L linha, U, R linha, U linha, L.',
      ],
    },
    'ycp-try-twice': {
      say: `Mesma ideia, mas desta vez são duas rodadas.`,
      done: `Duas rodadas, todas as quinas em casa.`,
      hints: ['Mantenha a quina que está no lugar na frente, à direita.', 'Faça o algoritmo, confira, e faça de novo.'],
    },

    // ── Torcer as quinas ──
    'yct-intro': {
      say: `Agora vamos torcer as quinas amarelas para o amarelo ficar para cima. Este é o passo em que você precisa confiar no processo.
        {{highlight piece:yellow,green,orange}}Segure o cubo com uma quina torcida na frente, à direita, em cima.
        {{keys R' D' R D}}Repita R linha, D linha, R, D, até o amarelo dela ficar para cima. {{moves (R' D' R D)4}}
        {{highlight none}}A parte de baixo parece bagunçada agora. Calma, e não gire o cubo inteiro.
        {{move U}}Gire só a camada de cima, para trazer a próxima quina torcida para a frente, à direita. {{moves (R' D' R D)2}}E repita.
        {{move U'}}{{keys none}}Quando todas as quinas estiverem prontas, a parte de baixo se arruma sozinha.`,
    },
    'yct-try': {
      say: `Sua vez. Torça as quinas até o amarelo ficar para cima em todas. Confie que a parte de baixo vai voltar.`,
      done: `Todas as quinas resolvidas, e a parte de baixo voltou.`,
      hints: [
        'Segure uma quina torcida na frente, à direita. Repita R linha, D linha, R, D até o amarelo dela ficar em cima.',
        'Depois gire só a camada de cima para trazer a próxima quina torcida para a frente, à direita, e repita.',
        'Quando todas as quinas estiverem prontas, gire a camada de cima até as quinas se alinharem com os centros.',
      ],
    },

    // ── Últimas arestas ──
    'le-intro': {
      say: `O último passo. Três arestas precisam trocar de lugar.
        {{highlight piece:yellow,blue}}Encontre a aresta que já está certa, com a cor lateral combinando com o centro abaixo dela. Segure ela atrás.
        {{keys R U' R U R U R U' R' U' R2}}R, U linha, R, U, R, U, R, U linha, R linha, U linha, R dois. {{moves R U' R U R U R U' R' U' R2}}
        {{keys none}}{{highlight none}}Resolvido. Se não resolver na primeira vez, faça de novo. E se nenhuma aresta estiver certa ainda, faça uma vez de qualquer lado, e uma delas vai ficar.`,
    },
    'le-try': {
      say: `É agora. Uma aresta já está certa, atrás. Termine o cubo.`,
      done: `Você resolveu o cubo.`,
      hints: ['A aresta amarela e azul já está certa, atrás.', 'Faça R, U linha, R, U, R, U, R, U linha, R linha, U linha, R dois.'],
    },
    'le-try-twice': {
      say: `Mais uma. Desta vez são duas rodadas.`,
      done: `Resolvido de novo.`,
      hints: ['Mantenha a aresta certa atrás.', 'Faça o algoritmo, e depois mais uma vez.'],
    },

    // ── Resolução completa ──
    'full-recap': {
      say: `Agora você conhece todos os passos. Aqui estão eles, em ordem.
        A margarida, depois a cruz branca. As quinas brancas. A camada do meio. A cruz amarela.
        As quinas amarelas no lugar, e depois torcer as quinas. E por fim, as últimas arestas.
        Agora vem um cubo totalmente embaralhado. Se travar, peça uma dica, e eu lembro em qual passo você está.`,
    },
    'full-try': {
      say: `Aqui está um cubo totalmente embaralhado. Resolva do começo ao fim, um passo de cada vez.`,
      done: `Você resolveu um cubo embaralhado, do começo ao fim. A maioria das pessoas nunca consegue isso.`,
      hints: [
        'Comece pela margarida: quatro arestas brancas em volta do centro amarelo.',
        'Depois a cruz branca e as quinas brancas.',
        'Depois a camada do meio, a cruz amarela, as quinas amarelas no lugar, torcer as quinas, e as últimas arestas.',
      ],
    },
    'full-next': {
      say: `Esse é o método inteiro. Daqui para frente, a prática é tudo. Embaralhe um cubo, resolva, e faça de novo.
        A cada vez, você vai precisar de menos dicas e menos pausas. Logo, você vai parar de pensar nos passos e começar a enxergá-los.
        Quando quiser ir mais rápido, existem métodos mais avançados. Mas este vai ser seu para sempre.
        Foi um prazer ensinar você.`,
    },
  },
};
