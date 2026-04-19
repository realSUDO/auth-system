import { Router } from 'express';
import { openidConfig , jwks} from '../controllers/oidcController.js';


const router = Router();

router.get('/.well-known/openid-configuration' , openidConfig);
router.get('/jwks' , jwks);

export default router;
