import part1 from './mlbUploaded/part1';
import part2 from './mlbUploaded/part2';
import part3 from './mlbUploaded/part3';
import part4 from './mlbUploaded/part4';
import part5 from './mlbUploaded/part5.txt?raw';
import part6 from './mlbUploaded/part6';

const base64 = `${part1}${part2}${part3}${part4}${part5}${part6}`.replace(/\s/g, '');
const mlbAllStarImage = `data:image/jpeg;base64,${base64}`;

export default mlbAllStarImage;
