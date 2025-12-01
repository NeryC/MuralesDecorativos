# Crear Usuarios Administradores

## Método Recomendado: Dashboard de Supabase

### Pasos:

1. **Accede a tu proyecto en Supabase Dashboard**
   - Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecciona tu proyecto

2. **Navega a Authentication → Users**
   - En el menú lateral izquierdo, busca "Authentication"
   - Haz clic en "Users"

3. **Crear nuevo usuario**
   - Haz clic en el botón **"Add user"** o **"Create new user"**
   - Selecciona **"Create new user"**

4. **Completa el formulario:**
   - **Email**: Ingresa el correo del administrador (ej: `admin@tudominio.com`)
   - **Password**: Crea una contraseña segura
   - **Auto Confirm User**: ✅ **Activa esta opción** (importante para que no requiera confirmación por email)

5. **Crea el usuario**
   - Haz clic en **"Create user"**

6. **¡Listo!** Ya puedes usar ese email y contraseña para iniciar sesión en `/admin/login`

---

## Método Alternativo: SQL (No recomendado)

Si prefieres usar SQL, puedes ejecutar el script `create_admin_user.sql`, pero **debes modificar**:
- El email del usuario
- La contraseña

**⚠️ ADVERTENCIA**: Este método es más complejo y propenso a errores. Es mejor usar el Dashboard.

---

## Verificar Usuarios Existentes

Para ver todos los usuarios creados:

1. Ve a **Authentication → Users** en el Dashboard
2. Verás una lista de todos los usuarios con:
   - Email
   - Última sesión
   - Fecha de creación
   - Estado (confirmado/no confirmado)

---

## Resetear Contraseña

Si un usuario olvidó su contraseña:

1. Ve a **Authentication → Users**
2. Busca el usuario en la lista
3. Haz clic en los tres puntos (⋯) junto al usuario
4. Selecciona **"Send password reset email"**

O desde el código, puedes usar:
```typescript
await supabase.auth.resetPasswordForEmail('usuario@example.com')
```

---

## Eliminar Usuario

1. Ve a **Authentication → Users**
2. Busca el usuario
3. Haz clic en los tres puntos (⋯)
4. Selecciona **"Delete user"**

---

## Notas Importantes

- ✅ **Auto Confirm User**: Siempre activa esta opción al crear usuarios manualmente
- 🔒 **Contraseñas seguras**: Usa contraseñas de al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos
- 📧 **Emails únicos**: Cada email solo puede estar registrado una vez
- 🔐 **Seguridad**: No compartas las credenciales de administrador

