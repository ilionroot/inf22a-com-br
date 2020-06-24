import Highway from '@dogstudio/highway';
import Fade from './pageTransition';

const H = new Highway.Core({
    transitions: {
        default: Fade
    }
});