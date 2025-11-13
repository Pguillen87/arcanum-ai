-- Fix security warnings: Add search_path to functions

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  -- Initialize credits with 100 free credits
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 100);
  
  -- Record initial credit transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, reason, ref_type)
  VALUES (NEW.id, 100, 100, 'Welcome bonus - 100 free credits', 'signup');
  
  -- Create welcome notification
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    NEW.id,
    'welcome',
    'Bem-vindo ao Arcanum AI! ✨',
    'Você recebeu 100 créditos gratuitos para começar sua jornada de transmutação criativa.',
    'high'
  );
  
  RETURN NEW;
END;
$$;