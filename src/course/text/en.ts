import type { CourseText } from '../types';

// English course text. Narration (`say`, `done`) is spoken by the tutor and
// shown as captions. Cue markers like {{move R}} fire on the word after them.
// Notation is written the way it is said ("R prime"), keycaps show symbols.

export const en: CourseText = {
  parts: {
    1: 'The cube',
    2: 'Moving the cube',
    3: 'Solving it',
    4: 'On your own',
  },

  lessons: {
    welcome: { title: 'Welcome', summary: 'How this course works, and your very first turn.' },
    history: { title: 'Where the cube came from', summary: 'A design professor, a puzzle by accident, and a very big number.' },
    anatomy: { title: 'Meet the pieces', summary: 'Centers, edges and corners, and the secret inside.' },
    turning: { title: 'Turning a face', summary: 'What one turn does, and what it leaves alone.' },
    notation: { title: 'The language of moves', summary: 'Six letters that describe every turn.' },
    pieces: { title: 'Follow one piece', summary: 'The habit that makes everything else easy.' },
    'first-algorithm': { title: 'Your first algorithm', summary: 'Four moves that come back home.' },
    plan: { title: 'The plan', summary: 'Solving one layer at a time, from the bottom up.' },
    daisy: { title: 'The daisy', summary: 'Gather the white edges around the yellow center.' },
    cross: { title: 'The white cross', summary: 'Send each petal down to its place.' },
    corners: { title: 'White corners', summary: 'Finish the first layer, one corner at a time.' },
    middle: { title: 'The middle layer', summary: 'Two mirror algorithms for four edges.' },
    'yellow-cross': { title: 'The yellow cross', summary: 'Dot, L, line, cross.' },
    'yellow-corners': { title: 'Yellow corners in place', summary: 'Put each corner where it belongs.' },
    'twist-corners': { title: 'Twist the corners', summary: 'The step where you have to trust the process.' },
    'last-edges': { title: 'The last edges', summary: 'One algorithm, and the cube is solved.' },
    'full-solve': { title: 'Solve it yourself', summary: 'A full scramble, start to finish.' },
  },

  steps: {
    // ── Welcome ──
    'welcome-intro': {
      say: `Hi. I'm going to be your tutor. Over the next lessons, you'll go from never having solved a cube to solving one on your own.
        You don't need to be fast, and you don't need to be good at puzzles. You only need a little patience.
        {{autorotate off}}{{view default}}Here's how this works. I'll explain things, and the cube on your screen will show you what I mean.
        You can touch it, too. Drag the empty space around it to look at it from any side. {{highlight layer:R}}And drag a face to turn it. {{highlight none}}
        Some lessons end with a small task. Finish it, and the next lesson opens. If you have a real cube, pick it up and follow along.`,
    },
    'welcome-try': {
      say: `Let's start with your first move. Drag any face of the cube, in any direction, and let go.`,
      done: `That's it. You just made your first turn.`,
      hints: [
        'Press on one of the colored squares and slide your finger or mouse across the cube.',
        'On a keyboard, you can also press the R key.',
      ],
    },

    // ── History: one story, scenes follow the narration ──
    'history-story': {
      say: `{{scene year}}In 1974, in Budapest, a young professor named {{scene rubik}}Ernő Rubik was teaching design and architecture.
        He wanted a way to show his students how objects can move in three dimensions.
        {{scene blocks}}{{explode on}}So he built a small cube out of smaller blocks, {{explode off}}one that could twist in every direction without falling apart.
        Then he turned it a few times. {{moves R U F'}} And then a few more. {{moves L D' B}}
        {{scene month}}Getting it back was much harder than he expected. It took him about a month to solve his own invention.
        {{scene timeline:1}}He called it the Magic Cube. {{scene timeline:2}}It went on sale in Hungarian toy shops in 1977, {{scene timeline:3}}and in 1980 it launched around the world under a new name: the Rubik's Cube.
        It became one of the best-selling puzzles ever made.
        {{state home: R U F' L D' B2 R' U2 F D2 L'}}{{scene patterns}}Here's why it's so hard. A cube like this can be mixed into more than forty-three quintillion different patterns. That's forty-three, followed by eighteen zeros.
        {{scene universe}}If you checked one pattern every second, it would take about a hundred times the age of the universe.
        {{state home}}{{scene one}}And only one of those patterns is solved.
        So how does anyone solve it? Not by luck.
        {{scene championship}}In 1982, the first world championship was held in Budapest. The winner solved the cube in under twenty-three seconds.
        {{scene gods-number}}In 2010, researchers used computers to prove that any mixed-up cube can be solved in twenty moves or fewer.
        {{scene method}}You won't need anything like that. You'll learn a method: a few steps, done in order, using a handful of short move sequences called algorithms.
        That's how everyone learns. And by the end of this course, you'll be doing it too.`,
    },

    // ── Anatomy ──
    'anatomy-core': {
      say: `Let's look closely. It looks like a stack of little cubes, but there's a secret inside.
        {{explode on}}Pull it apart, and there's no little cube in the middle. There's a core, with three axles.
        {{highlight type:center}}The six center pieces sit on the ends of those axles. They can spin in place, but they never move away from each other.
        {{explode off}}That's why white is always opposite yellow, green is opposite blue, and red is opposite orange.
        And it means something useful: the center tells you the color of its whole face. {{highlight none}}`,
    },
    'anatomy-pieces': {
      say: `{{highlight type:edge}}These are the edges. There are twelve of them, and each has two colors.
        {{highlight type:corner}}These are the corners. There are eight, and each has three colors.
        {{highlight none}}Turning moves pieces around, but a corner always stays a corner, and an edge always stays an edge.
        So you never really solve stickers. You solve pieces, and every piece has exactly one home.`,
    },
    'anatomy-corners': {
      say: `Your turn. Find all eight corners, and tap each one. Some of them are on the back, so you'll need to look around the cube.`,
      done: `All eight. Corners are the pieces with three colors.`,
      hints: [
        'Corners sit at the points of the cube, where three faces meet.',
        'Drag the empty space around the cube to see the back and bottom corners.',
      ],
    },
    'anatomy-edge': {
      say: `Now the cube is a little mixed up. Find the edge with white and green on it, and tap it.`,
      done: `Exactly. And its home is between the white center and the green center.`,
      hints: ['An edge has exactly two colors. Look for one with white and green.', 'Try looking at the cube from the right side and from below.'],
    },

    // ── Turning ──
    'turning-faces': {
      say: `Every turn moves one layer of nine pieces, and leaves the rest alone.
        Look at the cube from the front. {{highlight layer:R}}This is the right face.
        {{arrow R}}Turning it clockwise, as if you were looking at it straight from the right side, lifts the front column up. {{move R}}Like that.
        {{arrow none}}{{move R'}}And this is counter-clockwise, the other way.
        {{highlight none}}Now watch the centers. {{moves U F}}However you turn, they stay right where they are.`,
    },
    'turning-try': {
      say: `Now you. Turn the right face clockwise, so the front column goes up.`,
      done: `Perfect. That's a clockwise turn of the right face.`,
      hints: ['Put your finger on the right column of the front face, and drag it upward.', 'On a keyboard, press R.'],
    },
    'turning-back': {
      say: `Now turn it back the other way, counter-clockwise, so the cube is solved again.`,
      done: `Nice. Every turn can be undone by turning the same face the other way.`,
      hints: ['Drag the right column of the front face downward.', 'On a keyboard, hold Shift and press R.'],
    },

    // ── Notation ──
    'notation-letters': {
      say: `Cubers write moves with letters. Each face has one.
        {{highlight layer:F}}F, for front. {{highlight layer:B}}B, for back. {{highlight layer:U}}U, for up. {{highlight layer:D}}D, for down.
        {{highlight layer:L}}L, for left. {{highlight layer:R}}And R, for right. {{highlight none}}
        A letter on its own means one quarter turn clockwise, as if you were looking straight at that face.
        {{keys R}}{{move R}}R. {{keys U}}{{move U}}U. {{keys F}}{{move F}}F. {{keys none}}`,
    },
    'notation-prime': {
      say: `A small mark after the letter, called prime, means counter-clockwise.
        {{keys R'}}{{move R'}}R prime. {{keys U'}}{{move U'}}U prime.
        A two means a half turn. {{keys F2}}{{move F2}}F two. {{keys none}}{{move F2}}
        Here's a tip that saves a lot of confusion. For the left, down and back faces, clockwise still means as seen from that side.
        {{arrow L}}So L moves the front column down, {{move L}}not up. {{arrow none}}`,
    },
    'notation-try': {
      say: `Your turn to read. Do U, and then R prime.`,
      done: `Exactly right. You just followed written notation.`,
      hints: [
        'U turns the top face, so the front row moves to the left.',
        'R prime turns the right face so the front column goes down.',
      ],
    },
    'notation-read': {
      say: `One more, a little longer. F, then U two, then L prime.`,
      done: `Great. If you can read that, you can read any algorithm.`,
      hints: [
        'F turns the front face clockwise, like a steering wheel turning right.',
        'U two is a half turn of the top. L prime lifts the front column of the left face up.',
      ],
    },

    // ── Follow one piece ──
    'pieces-follow': {
      say: `Here's the most useful habit in cubing: follow one piece.
        {{highlight piece:white,green}}Watch the white and green edge. {{move F}}F carries it down to the right side.
        {{move U}}Now U turns the top, but our edge isn't in the top layer anymore, so it doesn't move.
        {{move U'}}{{move F'}}Undo those, and it's home again. {{highlight none}}
        Before every turn, ask yourself two questions. What moves? And what stays?`,
    },
    'pieces-try': {
      say: `Move the white and green edge down to the bottom of the front face. It can be any way around.`,
      done: `That's it. A half turn of the front face moved exactly the piece you wanted.`,
      hints: ['The edge is on the front face. Which turns move pieces of the front face?', 'Try turning the front face twice.'],
    },

    // ── First algorithm ──
    'alg-meet': {
      say: `An algorithm is a short sequence of moves that you can repeat. Here's the most famous one.
        {{keys R U R' U'}}R, U, R prime, U prime. {{moves R U R' U'}}
        A few pieces moved, but most of the cube is still solved.
        Now here's the surprise. {{moves (R U R' U')5}}If you repeat it six times in a row, everything goes back exactly to where it started.
        {{keys none}}That's the big idea behind solving. An algorithm moves a few pieces in a known way, while everything else comes back home.`,
    },
    'alg-try': {
      say: `Your turn. Do R, U, R prime, U prime, once.`,
      done: `Well done. Notice which pieces changed, and which stayed.`,
      hints: ['R lifts the front column. U turns the top to the left.', 'R prime brings the right column down, and U prime turns the top back to the right.'],
    },
    'alg-six': {
      say: `Now keep repeating it until the cube is solved again. It should take five more times.`,
      done: `Solved. You've just felt how an algorithm works.`,
      hints: ['Keep going: R, U, R prime, U prime.', 'Count your repetitions. Five more brings you back to the start.'],
    },

    // ── The plan ──
    'plan-layers': {
      say: `Now hold the cube with the white center on the bottom, yellow on top, and green facing you. We'll call this the solving grip.
        We'll solve the cube one layer at a time, from the bottom up, like building a house.
        {{highlight pieces:white,green;white,orange;white,blue;white,red}}First, a white cross on the bottom.
        {{highlight pieces:white,green,orange;white,green,red;white,blue,orange;white,blue,red}}Then the four white corners, which finishes the first layer.
        {{highlight pieces:green,orange;green,red;blue,orange;blue,red}}Then the four edges of the middle layer.
        {{highlight layer:U}}And finally the yellow layer on top, in four short steps. {{highlight none}}
        Each step keeps the work you've already done. Let's begin.`,
    },

    // ── Daisy ──
    'daisy-goal': {
      say: `The white cross starts with a shape called the daisy.
        {{highlight pieces:white,green;white,orange;white,blue;white,red}}It's the yellow center on top, surrounded by four white edges, like petals around a flower. The white stickers all face up.
        The petals' other colors don't matter yet. We only need four white petals.
        {{highlight none}}{{view default}}The daisy is easy to build, because the top is where you can see your work.`,
    },
    'daisy-rules': {
      say: `To build it, find a white edge, and bring it up to the top with white facing up.
        {{state daisy: R'}}{{highlight piece:white,orange}}If the edge is in the middle layer, turn the side face that lifts its white sticker to the top. {{move R}}Here, that's R.
        {{state daisy: R2}}If the edge is on the bottom with white facing down, turn that face twice. {{move R2}}
        {{highlight none}}And if the white sticker faces sideways, one turn moves it into the middle layer, and then you lift it as before.
        There's one rule. Before you lift a piece, turn the top so the spot it's going into isn't already a petal. Otherwise you'd knock that petal off.`,
    },
    'daisy-try-middle': {
      say: `Three petals are done. Find the fourth white edge in the middle layer, and lift it up.`,
      done: `A full daisy.`,
      hints: ['The white edge is on the front face, in the middle row, on the right.', 'Turn the right face clockwise to lift it: R.'],
    },
    'daisy-try-bottom': {
      say: `This time, the last white edge is on the bottom. Remember the rule before you lift it.`,
      done: `Nice. You protected your petal first.`,
      hints: [
        'Look under the cube: the white edge is on the bottom, on the right side.',
        'The spot above it already has a petal. Turn the top once first, then turn the right face twice.',
      ],
    },
    'daisy-try-full': {
      say: `Now build a whole daisy from a mixed-up cube. Take your time, and remember the rule.`,
      done: `That's a daisy you built on your own.`,
      hints: [
        'Find any white edge that is not yet a petal, and work out which situation it is in.',
        'Middle layer: lift with one turn. Bottom, white down: turn twice. White facing sideways: one turn first.',
        'Before lifting, turn the top so the spot is free.',
      ],
    },

    // ── Cross ──
    'cross-flip': {
      say: `Now each petal goes down to the bottom.
        {{highlight piece:white,green}}Pick a petal, and look at its other color. This one is green.
        {{move U'}}Turn the top until the green sticker sits right above the green center.
        {{move F2}}Then turn that face twice. The white edge lands on the bottom, exactly where it belongs.
        {{highlight none}}Do the same for the other three petals: line it up, then two turns.`,
    },
    'cross-try': {
      say: `Your turn. Send all four petals down to make the white cross.`,
      done: `That's the white cross.`,
      hints: [
        'Turn the top until one petal’s side color matches the center below it.',
        'Then turn that face twice. Repeat for each petal.',
      ],
    },
    'cross-check': {
      say: `Let's look underneath. {{view bottom}}A white cross, and each edge's side color matches the center next to it. That second part is what makes it a real cross.
        {{view default}}{{highlight none}}One layer started. Next, the corners.`,
    },

    // ── White corners ──
    'corners-drop': {
      say: `Now the four white corners, with white still on the bottom.
        {{highlight piece:white,green,orange}}This corner belongs between the white, green and orange centers. Right now, it's waiting right above its spot.
        Hold the cube so its spot is at the front right, on the bottom.
        {{keys R U R' U'}}Now repeat the algorithm you already know: R, U, R prime, U prime. {{moves (R U R' U')3}}
        Keep repeating until the corner drops in with white on the bottom. It takes one, three or five times, depending on how it's turned.
        {{keys none}}{{highlight none}}`,
    },
    'corners-find': {
      say: `If the corner is somewhere else in the top layer, turn the top first.
        {{highlight piece:white,green,orange}}{{move U'}}Bring it right above its spot, between its colors. {{moves R U R' U'}}Then repeat the algorithm.
        {{highlight none}}And if a white corner is stuck in the bottom layer in the wrong place, do the algorithm once at that spot. It pops the corner up to the top, and you can place it properly.`,
    },
    'corners-try': {
      say: `Your turn. The last corner is waiting above its spot. Repeat the algorithm until it drops in.`,
      done: `The first layer is complete.`,
      hints: [
        "Hold the corner at the front right, above its spot.",
        "Repeat R, U, R prime, U prime until white is on the bottom. It can take five times.",
      ],
    },
    'corners-try-align': {
      say: `This corner isn't above its spot yet. Move it there first, then insert it.`,
      done: `Nicely done. Line it up, then repeat.`,
      hints: ['Turn the top until the corner sits between its own colors, at the front right.', 'Then repeat R, U, R prime, U prime.'],
    },
    'corners-try-all': {
      say: `Now all four corners need placing. Finish the whole first layer.`,
      done: `A complete first layer. That's a real milestone.`,
      hints: [
        'Pick a white corner in the top layer and read its other two colors.',
        'Turn the top until it’s above the spot between those two centers, then hold that spot at the front right.',
        'Repeat R, U, R prime, U prime. If a corner is stuck in the bottom in the wrong spot, do the algorithm once to pop it out.',
      ],
    },

    // ── Middle layer ──
    'middle-right': {
      say: `Next, the middle layer: four edges with no yellow on them.
        {{highlight piece:green,orange}}Find a top-layer edge without yellow. Turn the top until its front color matches the center below it. Here it's green over green, like an upside-down T.
        Now look at its top color. Orange. The orange center is on the right, so the edge goes to the right.
        {{keys U R U' R' U' F' U F}}U, R, U prime, R prime, U prime, F prime, U, F. {{moves U R U' R' U' F' U F}}
        {{keys none}}{{highlight none}}It slides down into the middle layer, and your first layer is untouched.`,
    },
    'middle-left': {
      say: `{{highlight piece:green,red}}If the top color matches the center on the left, use the mirror image.
        {{keys U' L' U L U F U' F'}}U prime, L prime, U, L, U, F, U prime, F prime. {{moves U' L' U L U F U' F'}}
        {{keys none}}{{highlight none}}Right side or left side, it's the same idea, reflected.
        And if an edge is stuck in the middle layer the wrong way round, insert any top edge into that spot to pop it out.`,
    },
    'middle-try-right': {
      say: `Your turn. This edge needs to go to the right.`,
      done: `Right into place.`,
      hints: ['The edge is already lined up at the front. Its top color matches the right center.', 'Do U, R, U prime, R prime, U prime, F prime, U, F.'],
    },
    'middle-try-left': {
      say: `And this one goes to the left.`,
      done: `Mirror image, done.`,
      hints: ['Its top color matches the left center.', 'Do U prime, L prime, U, L, U, F, U prime, F prime.'],
    },
    'middle-try-all': {
      say: `Now solve the whole middle layer. You'll need to look around the cube to find every edge.`,
      done: `Two layers solved. Only the yellow layer is left.`,
      hints: [
        'Find a top edge with no yellow. Turn the top until its front color matches the center below it.',
        'Top color matches the right center: use the right algorithm. Left center: use the left one.',
        'Edges at the back? Look at the cube from that side and treat it as the front. If an edge is stuck in the middle the wrong way, insert any top edge there to pop it out.',
      ],
    },

    // ── Yellow cross ──
    'yc-cases': {
      say: `Time for the last layer. First, a yellow cross on top. Look only at the yellow edges, and ignore the corners.
        You'll see one of three shapes. A dot, an L, or a line.
        {{keys F R U R' U' F'}}If you see a dot, do F, R, U, R prime, U prime, F prime. {{moves F R U R' U' F'}}Now you have an L.
        {{state grip: F U R U' R' F' F U R U' R' F'}}Hold the L so it points to the back and the left, like this, and do it again. {{moves F R U R' U' F'}}Now it's a line.
        Hold the line flat, from left to right, and one more time. {{moves F R U R' U' F'}}A yellow cross.
        {{keys none}}`,
    },
    'yc-try-line': {
      say: `Here's a line, already flat from left to right. Make the cross.`,
      done: `Line to cross.`,
      hints: ['The line already runs left to right.', 'Do F, R, U, R prime, U prime, F prime.'],
    },
    'yc-try-l': {
      say: `Now an L. It's already pointing back and left. Take it all the way to the cross.`,
      done: `L, line, cross. You've got it.`,
      hints: ['Do the algorithm once to turn the L into a line.', 'Then do it once more with the line flat, left to right.'],
    },
    'yc-try-dot': {
      say: `And finally, a dot. Go from dot to cross on your own.`,
      done: `Dot to cross. That's the whole step.`,
      hints: [
        'Do the algorithm once to get an L.',
        'Turn the top so the L points back and left, then do it again for a line.',
        'Hold the line flat, left to right, and do it one last time.',
      ],
    },

    // ── Yellow corners in place ──
    'ycp-intro': {
      say: `Next, put the yellow corners in their places. Don't worry yet about which way they face.
        A corner is in place when its three colors match the three centers around it, even if it's twisted.
        {{highlight piece:yellow,green,orange}}This one is in place. Hold the cube so it's at the front right, on top.
        {{keys U R U' L' U R' U' L}}U, R, U prime, L prime, U, R prime, U prime, L. {{moves U R U' L' U R' U' L}}
        The corner at the front right stays put, and the other three trade places. Repeat until all four are home.
        {{keys none}}{{highlight none}}If no corner is in place, do the algorithm once from anywhere, and one will be.`,
    },
    'ycp-try': {
      say: `One corner is already in place. Hold it at the front right, and put the other three in place.`,
      done: `All four corners are in place.`,
      hints: [
        'The yellow, green and orange corner is already home, at the front right.',
        'Do U, R, U prime, L prime, U, R prime, U prime, L.',
      ],
    },
    'ycp-try-twice': {
      say: `Same idea, but this time it takes two rounds.`,
      done: `Two rounds, every corner home.`,
      hints: ['Keep the corner that is in place at the front right.', 'Do the algorithm, check, and do it again.'],
    },

    // ── Twist corners ──
    'yct-intro': {
      say: `Now we twist the yellow corners so yellow faces up. This is the step where you have to trust the process.
        {{highlight piece:yellow,green,orange}}Hold the cube with a twisted corner at the front right, on top.
        {{keys R' D' R D}}Repeat R prime, D prime, R, D, until its yellow faces up. {{moves (R' D' R D)4}}
        {{highlight none}}The bottom looks broken now. Don't panic, and don't turn the whole cube.
        {{move U}}Turn only the top, to bring the next twisted corner to the front right. {{moves (R' D' R D)2}}And repeat.
        {{move U'}}{{keys none}}When every corner is done, the bottom fixes itself.`,
    },
    'yct-try': {
      say: `Your turn. Twist the corners until yellow faces up on all of them. Trust the bottom to come back.`,
      done: `Every corner is solved, and the bottom came back.`,
      hints: [
        'Hold a twisted corner at the front right. Repeat R prime, D prime, R, D until its yellow is on top.',
        'Then turn only the top to bring the next twisted corner to the front right, and repeat.',
        'When all corners are done, turn the top until the corners line up with the centers.',
      ],
    },

    // ── Last edges ──
    'le-intro': {
      say: `The very last step. Three edges need to trade places.
        {{highlight piece:yellow,blue}}Find the edge that's already right, with its side color matching the center below it. Hold it at the back.
        {{keys R U' R U R U R U' R' U' R2}}R, U prime, R, U, R, U, R, U prime, R prime, U prime, R two. {{moves R U' R U R U R U' R' U' R2}}
        {{keys none}}{{highlight none}}Solved. If it isn't solved after once, do it again. And if no edge is right yet, do it once from any side, and one will be.`,
    },
    'le-try': {
      say: `This is it. One edge is already right, at the back. Finish the cube.`,
      done: `You solved the cube.`,
      hints: ['The yellow and blue edge is already right, at the back.', 'Do R, U prime, R, U, R, U, R, U prime, R prime, U prime, R two.'],
    },
    'le-try-twice': {
      say: `One more. This time it takes two rounds.`,
      done: `Solved again.`,
      hints: ['Keep the correct edge at the back.', 'Do the algorithm, then do it once more.'],
    },

    // ── Full solve ──
    'full-recap': {
      say: `You know every step now. Here they are, in order.
        The daisy, then the white cross. The white corners. The middle layer. The yellow cross.
        Yellow corners in place, then twist them. And finally, the last edges.
        Next comes a fully mixed cube. If you get stuck, ask for a hint, and I'll remind you which step you're on.`,
    },
    'full-try': {
      say: `Here's a fully scrambled cube. Solve it from start to finish, one step at a time.`,
      done: `You solved a scrambled cube, start to finish. That's something most people never do.`,
      hints: [
        'Start with the daisy: four white edges around the yellow center.',
        'Then the white cross, and the white corners.',
        'Then the middle layer, the yellow cross, yellow corners in place, twist them, and the last edges.',
      ],
    },
    'full-next': {
      say: `That's the whole method. From here, practice is everything. Scramble a cube, solve it, and do it again.
        Each time, you'll need fewer hints and fewer pauses. Soon, you'll stop thinking about the steps, and start seeing them.
        When you're ready to go faster, there are more advanced methods. But you'll always have this one.
        Thank you for learning with me.`,
    },
  },
};
