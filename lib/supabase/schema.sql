-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'retailer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    gst DECIMAL(5,2) DEFAULT 0,
    supplier VARCHAR(255),
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    invoice_number VARCHAR(100),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    gst_enabled BOOLEAN DEFAULT true,
    default_gst_rate DECIMAL(5,2) DEFAULT 18.0,
    business_name VARCHAR(255),
    business_address TEXT,
    business_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- Create Row Level Security policies

-- Profiles policies
CREATE POLICY \"Users can view their own profile\" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY \"Users can update their own profile\" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY \"Users can insert their own profile\" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY \"Users can view their own products\" ON products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY \"Users can create their own products\" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY \"Users can update their own products\" ON products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY \"Users can delete their own products\" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- Sales policies
CREATE POLICY \"Users can view their own sales\" ON sales
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY \"Users can create their own sales\" ON sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY \"Users can update their own sales\" ON sales
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY \"Users can delete their own sales\" ON sales
    FOR DELETE USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY \"Users can view their own settings\" ON settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY \"Users can create their own settings\" ON settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY \"Users can update their own settings\" ON settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name'
    );
    
    -- Create default settings for new user
    INSERT INTO public.settings (user_id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();